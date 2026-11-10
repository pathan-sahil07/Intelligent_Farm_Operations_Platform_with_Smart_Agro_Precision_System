package com.farmverse.farm.service;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.InventoryItem;
import com.farmverse.farm.entity.InventoryTransaction;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.notification.NotificationService;
import com.farmverse.farm.repository.*;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.service.InventoryService.TransactionRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {
    @Mock InventoryItemRepository items;
    @Mock InventoryTransactionRepository transactions;
    @Mock SupplierRepository suppliers;
    @Mock FarmAccessService access;
    @Mock AuditService audit;
    @Mock NotificationService notifications;
    InventoryService service;
    InventoryItem item;

    @BeforeEach
    void setUp() {
        service = new InventoryService(items, transactions, suppliers, access, audit, notifications);
        item = new InventoryItem();
        item.setId(1L);
        item.setFarmId(9L);
        item.setName("Urea");
        item.setCategory("FERTILIZER");
        item.setUnit("kg");
        item.setQuantity(new BigDecimal("100"));
        item.setReorderLevel(new BigDecimal("20"));
        lenient().when(items.findById(1L)).thenReturn(Optional.of(item));
        lenient().when(transactions.save(any(InventoryTransaction.class))).thenAnswer(i -> i.getArgument(0));
    }

    private TransactionRequest req(String type, String qty) {
        return new TransactionRequest(type, new BigDecimal(qty), null, null, null, null);
    }

    @Test
    void purchaseIncreasesStock() {
        service.transact(1L, req("PURCHASE", "50"));
        assertEquals(0, new BigDecimal("150").compareTo(item.getQuantity()));
    }

    @Test
    void consumptionDecreasesStock() {
        service.transact(1L, req("CONSUMPTION", "30"));
        assertEquals(0, new BigDecimal("70").compareTo(item.getQuantity()));
        verifyNoInteractions(notifications);
    }

    @Test
    void consumptionBeyondStockIsRejectedAndStockUnchanged() {
        assertThrows(BadRequestException.class, () -> service.transact(1L, req("CONSUMPTION", "101")));
        assertEquals(0, new BigDecimal("100").compareTo(item.getQuantity()));
        verify(transactions, never()).save(any());
    }

    @Test
    void crossingReorderLevelNotifiesOnce() {
        service.transact(1L, req("CONSUMPTION", "85"));
        verify(notifications).notifyFarm(eq(9L), eq("LOW_STOCK"), anyString(), anyString(), anyString(), anyString());
        reset(notifications);
        service.transact(1L, req("CONSUMPTION", "5"));
        verifyNoInteractions(notifications); // was already low
    }

    @Test
    void unknownTransactionTypeIsRejected() {
        assertThrows(BadRequestException.class, () -> service.transact(1L, req("GIFT", "1")));
    }

    @Test
    void consumeForCropRejectsItemFromAnotherFarm() {
        assertThrows(BadRequestException.class, () -> service.consume(1L, BigDecimal.ONE, 5L, 99L, "x"));
    }
}
