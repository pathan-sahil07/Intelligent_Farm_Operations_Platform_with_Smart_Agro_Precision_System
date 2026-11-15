package com.farmverse.farm.repository;

import com.farmverse.farm.entity.CropActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CropActivityRepository extends JpaRepository<CropActivity, Long> {
    List<CropActivity> findByCropIdOrderByActivityDateDescIdDesc(Long cropId);
}
