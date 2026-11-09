package com.farmverse.farm.controller;

import com.farmverse.farm.entity.InventoryItem;
import com.farmverse.farm.entity.InventoryTransaction;
import com.farmverse.farm.entity.Supplier;
import com.farmverse.farm.service.InventoryService;
import com.farmverse.farm.service.InventoryService.TransactionRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService service;

    @GetMapping("/inventory")
    @PreAuthorize("hasAuthority('INVENTORY_READ')")
    public List<InventoryItem> list(@RequestParam(required = false) Long farmId,
                                    @RequestParam(required = false) String category,
                                    @RequestParam(defaultValue = "false") boolean lowStock) {
        return service.list(farmId, category, lowStock);
    }

    @GetMapping("/inventory/low-stock")
    @PreAuthorize("hasAuthority('INVENTORY_READ')")
    public List<InventoryItem> lowStock(@RequestParam(required = false) Long farmId) {
        return service.list(farmId, null, true);
    }

    @PostMapping("/inventory")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('INVENTORY_WRITE')")
    public InventoryItem create(@Valid @RequestBody InventoryItem item) {
        return service.create(item);
    }

    @PutMapping("/inventory/{id}")
    @PreAuthorize("hasAuthority('INVENTORY_WRITE')")
    public InventoryItem update(@PathVariable Long id, @Valid @RequestBody InventoryItem item) {
        return service.update(id, item);
    }

    @DeleteMapping("/inventory/{id}")
    @PreAuthorize("hasAuthority('INVENTORY_WRITE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/inventory/{id}/transactions")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('INVENTORY_WRITE')")
    public InventoryTransaction transact(@PathVariable Long id, @Valid @RequestBody TransactionRequest request) {
        return service.transact(id, request);
    }

    @GetMapping("/inventory/{id}/transactions")
    @PreAuthorize("hasAuthority('INVENTORY_READ')")
    public List<InventoryTransaction> itemTransactions(@PathVariable Long id) {
        return service.itemHistory(id);
    }

    @GetMapping("/inventory/transactions")
    @PreAuthorize("hasAuthority('INVENTORY_READ')")
    public Page<InventoryTransaction> history(@RequestParam(required = false) Long farmId,
                                              @RequestParam(required = false) String type,
                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return service.history(farmId, type, from, to,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/inventory/purchases")
    @PreAuthorize("hasAuthority('INVENTORY_READ')")
    public Page<InventoryTransaction> purchases(@RequestParam(required = false) Long farmId,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        return service.history(farmId, "PURCHASE", null, null,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    // ---- suppliers ----
    @GetMapping("/suppliers")
    @PreAuthorize("hasAuthority('INVENTORY_READ')")
    public List<Supplier> suppliers(@RequestParam(required = false) Long farmId) {
        return service.listSuppliers(farmId);
    }

    @PostMapping("/suppliers")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('INVENTORY_WRITE')")
    public Supplier createSupplier(@Valid @RequestBody Supplier supplier) {
        return service.createSupplier(supplier);
    }

    @PutMapping("/suppliers/{id}")
    @PreAuthorize("hasAuthority('INVENTORY_WRITE')")
    public Supplier updateSupplier(@PathVariable Long id, @Valid @RequestBody Supplier supplier) {
        return service.updateSupplier(id, supplier);
    }

    @DeleteMapping("/suppliers/{id}")
    @PreAuthorize("hasAuthority('INVENTORY_WRITE')")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        service.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }
}
