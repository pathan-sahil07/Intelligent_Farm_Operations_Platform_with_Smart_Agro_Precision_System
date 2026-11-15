package com.farmverse.farm.repository;

import com.farmverse.farm.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findByFarmIdOrderByNameAsc(Long farmId);

    @Query("""
            select e from Equipment e
            where (e.farmId in :ids or (:legacy = true and e.farmId is null))
              and e.status like :status and e.category like :category
            order by e.name""")
    List<Equipment> search(@Param("ids") Collection<Long> ids, @Param("legacy") boolean legacy,
                           @Param("status") String status, @Param("category") String category);
}
