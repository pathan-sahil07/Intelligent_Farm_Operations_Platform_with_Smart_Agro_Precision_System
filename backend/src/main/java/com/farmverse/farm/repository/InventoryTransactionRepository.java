package com.farmverse.farm.repository;

import com.farmverse.farm.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByInventoryItemIdOrderByCreatedAtDesc(Long inventoryItemId);

    @Query("""
            select t from InventoryTransaction t
            where (t.inventoryItem.farmId in :ids or (:legacy = true and t.inventoryItem.farmId is null))
              and t.transactionType like :type
              and t.createdAt >= :from and t.createdAt < :to""")
    Page<InventoryTransaction> history(@Param("ids") Collection<Long> ids, @Param("legacy") boolean legacy,
                                       @Param("type") String type, @Param("from") LocalDateTime from,
                                       @Param("to") LocalDateTime to, Pageable pageable);
}
