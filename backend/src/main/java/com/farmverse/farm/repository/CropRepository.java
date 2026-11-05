package com.farmverse.farm.repository;

import com.farmverse.farm.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    long countByStatus(String status);
    List<Crop> findAllByOrderByCreatedAtDesc();
}
