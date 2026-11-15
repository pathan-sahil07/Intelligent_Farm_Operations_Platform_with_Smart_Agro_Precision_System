package com.farmverse.farm.repository;

import com.farmverse.farm.entity.FarmResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface FarmResourceRepository extends JpaRepository<FarmResource, Long> {
    List<FarmResource> findByFarmIdOrderByNameAsc(Long farmId);

    @Query("""
            select r from FarmResource r
            where r.farmId in :ids or (:legacy = true and r.farmId is null)
            order by r.name""")
    List<FarmResource> search(@Param("ids") Collection<Long> ids, @Param("legacy") boolean legacy);
}
