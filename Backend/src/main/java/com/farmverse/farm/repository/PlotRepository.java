
package com.farmverse.farm.repository;

import com.farmverse.farm.entity.Plot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PlotRepository extends JpaRepository<Plot, Long> {

    List<Plot> findByFarm_Id(Long farmId);

    long countByFarm_Id(Long farmId);

    void deleteByFarm_Id(Long farmId);

    boolean existsByFarm_IdAndNameIgnoreCase(Long farmId, String name);

    boolean existsByFarm_IdAndNameIgnoreCaseAndIdNot(Long farmId, String name, Long id);

    /**
     * Total area already divided into plots
     * (null when the farm has no plots).
     */
    @Query("select sum(p.areaAcres) from Plot p where p.farm.id = :farmId")
    BigDecimal sumAreaByFarmId(@Param("farmId") Long farmId);
}
