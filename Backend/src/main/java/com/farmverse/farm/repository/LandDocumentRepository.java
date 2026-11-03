
package com.farmverse.farm.repository;

import com.farmverse.farm.entity.LandDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LandDocumentRepository
        extends JpaRepository<LandDocument, Long> {

    List<LandDocument> findByFarm_Id(Long farmId);

    long countByFarm_Id(Long farmId);

    void deleteByFarm_Id(Long farmId);
}
