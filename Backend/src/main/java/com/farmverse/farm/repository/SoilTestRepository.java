
package com.farmverse.farm.repository;

import com.farmverse.farm.entity.SoilTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SoilTestRepository extends JpaRepository<SoilTest, Long> {

    List<SoilTest> findByPlot_IdOrderByTestDateDesc(Long plotId);

    Optional<SoilTest> findFirstByPlot_IdOrderByTestDateDescIdDesc(Long plotId);

    void deleteByPlot_Id(Long plotId);

    void deleteByPlot_Farm_Id(Long farmId);
}
