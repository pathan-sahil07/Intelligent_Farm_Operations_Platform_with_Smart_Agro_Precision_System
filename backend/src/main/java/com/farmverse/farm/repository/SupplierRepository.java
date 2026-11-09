package com.farmverse.farm.repository;

import com.farmverse.farm.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    @Query("select s from Supplier s where s.farmId in :ids order by s.name")
    List<Supplier> findByFarms(@Param("ids") Collection<Long> ids);

    boolean existsByFarmIdAndNameIgnoreCase(Long farmId, String name);
}
