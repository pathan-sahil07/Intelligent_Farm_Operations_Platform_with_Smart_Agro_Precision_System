package com.farmverse.farm.repository;

import com.farmverse.farm.entity.HarvestRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HarvestRecordRepository extends JpaRepository<HarvestRecord, Long> {
    List<HarvestRecord> findAllByOrderByHarvestDateDescIdDesc();
}
