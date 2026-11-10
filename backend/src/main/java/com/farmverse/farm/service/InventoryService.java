package com.farmverse.farm.service;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.InventoryItem;
import com.farmverse.farm.entity.InventoryTransaction;
import com.farmverse.farm.entity.Supplier;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ConflictException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.notification.NotificationService;
import com.farmverse.farm.repository.InventoryItemRepository;
import com.farmverse.farm.repository.InventoryTransactionRepository;
import com.farmverse.farm.repository.SupplierRepository;
import com.farmverse.farm.security.CurrentUser;
import com.farmverse.farm.security.FarmAccessService;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class InventoryService {
    public static final Set<String> CATEGORIES = Set.of("SEED", "FERTILIZER", "PESTICIDE", "CONSUMABLE", "OTHER");
    public static final Set<String> TYPES = Set.of("PURCHASE", "CONSUMPTION", "TRANSFER");

    public record TransactionRequest(@NotNull String transactionType, @NotNull @Positive BigDecimal quantity,
                                     @PositiveOrZero BigDecimal unitCost, Long supplierId, Long cropId, String notes) {
    }

    private final InventoryItemRepository items;
    private final InventoryTransactionRepository transactions;
    private final SupplierRepository suppliers;
    private final FarmAccessService access;
    private final AuditService audit;
    private final NotificationService notifications;

    public InventoryService(InventoryItemRepository items, InventoryTransactionRepository transactions,
                            SupplierRepository suppliers, FarmAccessService access, AuditService audit,
                            NotificationService notifications) {
        this.items = items;
        this.transactions = transactions;
        this.suppliers = suppliers;
        this.access = access;
        this.audit = audit;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<InventoryItem> list(Long farmId, String category, boolean lowStockOnly) {
        FarmAccessService.Scope scope = access.scope(farmId);
        return items.search(scope.ids(), scope.legacy(), category == null || category.isBlank() ? "%" : category).stream()
                .filter(i -> !lowStockOnly || i.isLowStock()).toList();
    }

    @Transactional
    public InventoryItem create(InventoryItem item) {
        if (item.getFarmId() == null) throw new BadRequestException("farmId is required");
        access.requireAccess(item.getFarmId());
        validate(item);
        item.setId(null);
        InventoryItem saved = items.save(item);
        audit.log("CREATE", "INVENTORY_ITEM", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public InventoryItem update(Long id, InventoryItem body) {
        InventoryItem item = load(id);
        validate(body);
        item.setName(body.getName());
        item.setCategory(body.getCategory());
        item.setUnit(body.getUnit());
        item.setReorderLevel(body.getReorderLevel());
        item.setUnitCost(body.getUnitCost());
        item.setExpiryDate(body.getExpiryDate());
        item.setSupplierId(body.getSupplierId());
        audit.log("UPDATE", "INVENTORY_ITEM", id, item.getName());
        return items.save(item);
    }

    @Transactional
    public void delete(Long id) {
        InventoryItem item = load(id);
        items.delete(item);
        audit.log("DELETE", "INVENTORY_ITEM", id, item.getName());
    }

    @Transactional
    public InventoryTransaction transact(Long itemId, TransactionRequest req) {
        InventoryItem item = load(itemId);
        if (!TYPES.contains(req.transactionType())) {
            throw new BadRequestException("transactionType must be PURCHASE, CONSUMPTION, or TRANSFER");
        }
        if (req.supplierId() != null) {
            Supplier s = suppliers.findById(req.supplierId())
                    .orElseThrow(() -> new BadRequestException("Unknown supplierId"));
            if (!s.getFarmId().equals(item.getFarmId())) throw new BadRequestException("Supplier belongs to another farm");
        }
        BigDecimal before = item.getQuantity();
        if ("CONSUMPTION".equals(req.transactionType())) {
            if (before.compareTo(req.quantity()) < 0) {
                throw new BadRequestException("Insufficient inventory stock: " + before.toPlainString() + " "
                        + item.getUnit() + " available");
            }
            item.setQuantity(before.subtract(req.quantity()));
        } else {
            item.setQuantity(before.add(req.quantity()));
            if ("PURCHASE".equals(req.transactionType()) && req.unitCost() != null) {
                item.setUnitCost(req.unitCost());
            }
        }
        InventoryTransaction tx = new InventoryTransaction();
        tx.setInventoryItem(item);
        tx.setTransactionType(req.transactionType());
        tx.setQuantity(req.quantity());
        tx.setUnitCost(req.unitCost());
        tx.setSupplierId(req.supplierId());
        tx.setCropId(req.cropId());
        tx.setNotes(req.notes());
        tx.setCreatedBy(CurrentUser.find().map(u -> u.getId()).orElse(null));
        items.save(item);
        InventoryTransaction saved = transactions.save(tx);
        audit.log(req.transactionType(), "INVENTORY_ITEM", itemId, req.quantity().toPlainString() + " " + item.getUnit());
        notifyIfLow(item, before);
        return saved;
    }

    /** Used by crop activities: consumes stock and links the transaction to the crop. */
    @Transactional
    public InventoryTransaction consume(Long itemId, BigDecimal quantity, Long cropId, Long cropFarmId, String notes) {
        InventoryItem item = load(itemId);
        if (cropFarmId != null && !cropFarmId.equals(item.getFarmId())) {
            throw new BadRequestException("Inventory item belongs to a different farm than the crop");
        }
        return transact(itemId, new TransactionRequest("CONSUMPTION", quantity, null, null, cropId, notes));
    }

    @Transactional(readOnly = true)
    public List<InventoryTransaction> itemHistory(Long itemId) {
        load(itemId);
        return transactions.findByInventoryItem_IdOrderByCreatedAtDesc(itemId);
    }

    @Transactional(readOnly = true)
    public Page<InventoryTransaction> history(Long farmId, String type, LocalDate from, LocalDate to, Pageable pageable) {
        FarmAccessService.Scope scope = access.scope(farmId);
        LocalDateTime start = from == null ? LocalDate.of(1970, 1, 1).atStartOfDay() : from.atStartOfDay();
        LocalDateTime end = to == null ? LocalDate.of(2999, 1, 1).atStartOfDay() : to.plusDays(1).atStartOfDay();
        return transactions.history(scope.ids(), scope.legacy(), type == null || type.isBlank() ? "%" : type,
                start, end, pageable);
    }

    // ---- suppliers ----
    @Transactional(readOnly = true)
    public List<Supplier> listSuppliers(Long farmId) {
        return suppliers.findByFarms(access.scope(farmId).ids());
    }

    @Transactional
    public Supplier createSupplier(Supplier s) {
        access.requireAccess(s.getFarmId());
        if (suppliers.existsByFarmIdAndNameIgnoreCase(s.getFarmId(), s.getName().trim())) {
            throw new ConflictException("A supplier with this name already exists on the farm");
        }
        s.setId(null);
        s.setName(s.getName().trim());
        Supplier saved = suppliers.save(s);
        audit.log("CREATE", "SUPPLIER", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public Supplier updateSupplier(Long id, Supplier body) {
        Supplier s = loadSupplier(id);
        s.setName(body.getName().trim());
        s.setContactPerson(body.getContactPerson());
        s.setPhone(body.getPhone());
        s.setEmail(body.getEmail());
        s.setAddress(body.getAddress());
        return suppliers.save(s);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier s = loadSupplier(id);
        suppliers.delete(s);
        audit.log("DELETE", "SUPPLIER", id, s.getName());
    }

    private Supplier loadSupplier(Long id) {
        Supplier s = suppliers.findById(id).orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        access.requireAccess(s.getFarmId());
        return s;
    }

    InventoryItem load(Long id) {
        InventoryItem item = items.findById(id).orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
        access.requireFarmOrLegacy(item.getFarmId());
        return item;
    }

    private void validate(InventoryItem item) {
        if (item.getCategory() == null || !CATEGORIES.contains(item.getCategory())) {
            throw new BadRequestException("category must be one of " + CATEGORIES);
        }
    }

    private void notifyIfLow(InventoryItem item, BigDecimal before) {
        boolean wasLow = item.getReorderLevel().signum() > 0 && before.compareTo(item.getReorderLevel()) <= 0;
        if (item.isLowStock() && !wasLow && item.getFarmId() != null) {
            notifications.notifyFarm(item.getFarmId(), "LOW_STOCK", "Low stock: " + item.getName(),
                    item.getName() + " is down to " + item.getQuantity().toPlainString() + " " + item.getUnit()
                            + " (reorder level " + item.getReorderLevel().toPlainString() + ").",
                    "/inventory", "low-stock:" + item.getId() + ":" + LocalDate.now());
        }
    }
}
