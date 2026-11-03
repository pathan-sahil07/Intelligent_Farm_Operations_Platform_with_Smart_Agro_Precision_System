package com.farmverse.farm.repository;

import com.farmverse.farm.entity.HarvestRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HarvestRecordRepository extends JpaRepository<HarvestRecord, Long> {
    @org.springframework.data.jpa.repository.Query("select sum(h.quantityKg) from HarvestRecord h")
    java.util.Optional<java.math.BigDecimal> totalQuantityKg();
    List<HarvestRecord> findAllByOrderByHarvestDateDescIdDesc();
}
