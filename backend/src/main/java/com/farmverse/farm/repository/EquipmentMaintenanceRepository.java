package com.farmverse.farm.repository;

import com.farmverse.farm.entity.EquipmentMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EquipmentMaintenanceRepository extends JpaRepository<EquipmentMaintenance, Long> {
    List<EquipmentMaintenance> findByEquipmentIdOrderByScheduledDateDesc(Long equipmentId);
}
