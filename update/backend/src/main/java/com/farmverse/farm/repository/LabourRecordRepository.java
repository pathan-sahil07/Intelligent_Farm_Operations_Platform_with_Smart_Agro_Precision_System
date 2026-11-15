package com.farmverse.farm.repository;

import com.farmverse.farm.entity.LabourRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface LabourRecordRepository extends JpaRepository<LabourRecord, Long> {
    @Query("""
            select l from LabourRecord l
            where l.farmId in :ids and l.workDate >= :from and l.workDate <= :to
            order by l.workDate desc, l.id desc""")
    List<LabourRecord> search(@Param("ids") Collection<Long> ids, @Param("from") LocalDate from,
                              @Param("to") LocalDate to);
}
