package com.farmverse.farm.repository;

import com.farmverse.farm.entity.CropHealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CropHealthRecordRepository extends JpaRepository<CropHealthRecord, Long> {
    List<CropHealthRecord> findByCropIdOrderByRecordDateDescIdDesc(Long cropId);
}
