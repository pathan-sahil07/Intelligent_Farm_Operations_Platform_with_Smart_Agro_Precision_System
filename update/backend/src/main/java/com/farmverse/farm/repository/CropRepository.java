package com.farmverse.farm.repository;

import com.farmverse.farm.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    long countByStatus(String status);

    List<Crop> findAllByOrderByCreatedAtDesc();

    List<Crop> findByFarmIdAndStatus(Long farmId, String status);

    @Query("""
            select c from Crop c
            where (c.farmId in :ids or (:legacy = true and c.farmId is null))
              and c.status like :status
              and (lower(c.name) like :q or lower(c.fieldName) like :q)
            order by c.createdAt desc""")
    List<Crop> search(@Param("ids") Collection<Long> ids, @Param("legacy") boolean legacy,
                      @Param("status") String status, @Param("q") String q);

    List<Crop> findByStatusAndExpectedHarvestDateBetween(String status, LocalDate from, LocalDate to);
}
