package com.farmverse.farm.repository;

import com.farmverse.farm.entity.EquipmentMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface EquipmentMaintenanceRepository extends JpaRepository<EquipmentMaintenance, Long> {
    List<EquipmentMaintenance> findByEquipment_IdOrderByScheduledDateDesc(Long equipmentId);

    List<EquipmentMaintenance> findByEquipment_IdAndCompletedDateIsNullOrderByScheduledDateAsc(Long equipmentId);

    @Query("""
            select m from EquipmentMaintenance m
            where m.equipment.farmId in :ids and m.completedDate is null and m.scheduledDate <= :until
            order by m.scheduledDate""")
    List<EquipmentMaintenance> due(@Param("ids") Collection<Long> ids, @Param("until") LocalDate until);
}
