package com.farmverse.farm.repository;

import com.farmverse.farm.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    List<Crop> findAllByOrderByCreatedAtDesc();
}
