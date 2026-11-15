package com.farmverse.farm.repository;

import com.farmverse.farm.entity.IrrigationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface IrrigationScheduleRepository extends JpaRepository<IrrigationSchedule, Long> {
    long countByStatus(String status);

    List<IrrigationSchedule> findAllByOrderByScheduledDateAscScheduledTimeAsc();

    List<IrrigationSchedule> findByFarmIdAndScheduledDate(Long farmId, LocalDate date);

    List<IrrigationSchedule> findByScheduledDateAndStatus(LocalDate date, String status);

    @Query("""
            select s from IrrigationSchedule s
            where (s.farmId in :ids or (:legacy = true and s.farmId is null))
              and s.status like :status
              and s.scheduledDate >= :from and s.scheduledDate <= :to
            order by s.scheduledDate asc, s.scheduledTime asc""")
    List<IrrigationSchedule> search(@Param("ids") Collection<Long> ids, @Param("legacy") boolean legacy,
                                    @Param("status") String status, @Param("from") LocalDate from,
                                    @Param("to") LocalDate to);
}
