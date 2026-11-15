package com.farmverse.farm.repository;

import com.farmverse.farm.entity.SoilMoistureReading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SoilMoistureRepository extends JpaRepository<SoilMoistureReading, Long> {
    List<SoilMoistureReading> findByPlotIdOrderByReadingDateDescIdDesc(Long plotId);

    Optional<SoilMoistureReading> findFirstByPlotIdOrderByReadingDateDescIdDesc(Long plotId);
}
