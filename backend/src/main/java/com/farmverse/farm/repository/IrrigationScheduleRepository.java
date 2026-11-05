package com.farmverse.farm.repository;

import com.farmverse.farm.entity.IrrigationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IrrigationScheduleRepository extends JpaRepository<IrrigationSchedule, Long> {
    long countByStatus(String status);
    List<IrrigationSchedule> findAllByOrderByScheduledDateAscScheduledTimeAsc();
}
