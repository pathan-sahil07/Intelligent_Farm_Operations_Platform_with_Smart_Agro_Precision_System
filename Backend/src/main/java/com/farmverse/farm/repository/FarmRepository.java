package com.farmverse.farm.repository;

import com.farmverse.farm.entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FarmRepository extends JpaRepository<Farm, Long> {

    List<Farm> findByOwnerId(Long ownerId);

    /** Farms a field worker is assigned to. */
    @Query("select fw.farm from FarmWorker fw where fw.userId = :userId")
    List<Farm> findByWorkerUserId(@Param("userId") Long userId);

    boolean existsByOwnerIdAndNameIgnoreCase(Long ownerId, String name);

    boolean existsByOwnerIdAndNameIgnoreCaseAndIdNot(Long ownerId, String name, Long id);
}
