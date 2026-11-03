package com.farmverse.farm.repository;

import com.farmverse.farm.entity.FarmResource;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FarmResourceRepository extends JpaRepository<FarmResource, Long> {
    List<FarmResource> findByFarmIdOrderByNameAsc(Long farmId);
}
