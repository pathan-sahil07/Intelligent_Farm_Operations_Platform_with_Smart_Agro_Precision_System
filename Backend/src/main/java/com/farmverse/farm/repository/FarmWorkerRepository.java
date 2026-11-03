package com.farmverse.farm.repository;

import com.farmverse.farm.entity.FarmWorker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FarmWorkerRepository
        extends JpaRepository<FarmWorker, Long> {

    List<FarmWorker> findByFarm_Id(Long farmId);

    List<FarmWorker> findByUserId(Long userId);

    boolean existsByFarm_IdAndUserId(Long farmId, Long userId);

    Optional<FarmWorker> findByFarm_IdAndUserId(
            Long farmId, Long userId);

    void deleteByFarm_Id(Long farmId);
}