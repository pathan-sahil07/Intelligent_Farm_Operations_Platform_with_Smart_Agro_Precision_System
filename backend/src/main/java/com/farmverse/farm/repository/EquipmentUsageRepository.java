package com.farmverse.farm.repository;

import com.farmverse.farm.entity.EquipmentUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentUsageRepository extends JpaRepository<EquipmentUsage, Long> {
    List<EquipmentUsage> findByEquipmentIdOrderByUsageDateDescIdDesc(Long equipmentId);
}
