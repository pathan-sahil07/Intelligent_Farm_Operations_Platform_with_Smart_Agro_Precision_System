package com.farmverse.farm.controller;

import com.farmverse.farm.entity.InventoryItem;
import com.farmverse.farm.entity.InventoryTransaction;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.InventoryItemRepository;
import com.farmverse.farm.repository.InventoryTransactionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryItemRepository items;
    private final InventoryTransactionRepository transactions;

    @GetMapping
    public List<InventoryItem> list(@RequestParam(required = false) Long farmId) {
        return farmId == null ? items.findAll() : items.findByFarmIdOrderByNameAsc(farmId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItem create(@Valid @RequestBody InventoryItem item) {
        item.setId(null);
        return items.save(item);
    }

    @PostMapping("/{id}/transactions")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public InventoryTransaction transact(@PathVariable Long id, @Valid @RequestBody InventoryTransaction request) {
        InventoryItem item = items.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
        BigDecimal quantity = request.getQuantity();
        if ("CONSUMPTION".equals(request.getTransactionType())) {
            if (item.getQuantity().compareTo(quantity) < 0) {
                throw new BadRequestException("Insufficient inventory stock");
            }
            item.setQuantity(item.getQuantity().subtract(quantity));
        } else if ("PURCHASE".equals(request.getTransactionType()) || "TRANSFER".equals(request.getTransactionType())) {
            item.setQuantity(item.getQuantity().add(quantity));
        } else {
            throw new BadRequestException("transactionType must be PURCHASE, CONSUMPTION, or TRANSFER");
        }
        request.setId(null);
        request.setInventoryItem(item);
        items.save(item);
        return transactions.save(request);
    }

    @GetMapping("/{id}/transactions")
    public List<InventoryTransaction> transactions(@PathVariable Long id) {
        if (!items.existsById(id)) throw new ResourceNotFoundException("Inventory item not found");
        return transactions.findAll().stream()
                .filter(transaction -> transaction.getInventoryItem().getId().equals(id))
                .toList();
    }
}
