package com.farmverse.farm.repository;

import com.farmverse.farm.entity.HarvestRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface HarvestRecordRepository extends JpaRepository<HarvestRecord, Long> {
    @Query("select sum(h.quantityKg) from HarvestRecord h")
    java.util.Optional<java.math.BigDecimal> totalQuantityKg();

    List<HarvestRecord> findAllByOrderByHarvestDateDescIdDesc();

    @Query("""
            select h from HarvestRecord h
            where (h.farmId in :ids or (:legacy = true and h.farmId is null))
              and h.harvestDate >= :from and h.harvestDate <= :to
            order by h.harvestDate desc, h.id desc""")
    List<HarvestRecord> search(@Param("ids") Collection<Long> ids, @Param("legacy") boolean legacy,
                               @Param("from") LocalDate from, @Param("to") LocalDate to);
}
