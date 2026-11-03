package com.farmverse.farm.repository;

import com.farmverse.farm.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findByFarmIdOrderByNameAsc(Long farmId);
}
