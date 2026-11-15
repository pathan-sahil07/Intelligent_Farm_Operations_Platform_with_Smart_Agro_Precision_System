package com.farmverse.farm.repository;

import com.farmverse.farm.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByFarmIdOrderByNameAsc(Long farmId);

    @Query("""
            select i from InventoryItem i
            where (i.farmId in :ids or (:legacy = true and i.farmId is null))
              and i.category like :category
            order by i.name""")
    List<InventoryItem> search(@Param("ids") Collection<Long> ids, @Param("legacy") boolean legacy,
                               @Param("category") String category);
}
