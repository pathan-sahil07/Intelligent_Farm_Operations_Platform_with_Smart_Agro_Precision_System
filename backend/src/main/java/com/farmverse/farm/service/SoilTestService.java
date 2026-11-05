
package com.farmverse.farm.service;

import com.farmverse.farm.entity.Plot;
import com.farmverse.farm.entity.SoilTest;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.PlotRepository;
import com.farmverse.farm.repository.SoilTestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SoilTestService {

    private final SoilTestRepository soilTestRepo;
    private final PlotRepository plotRepo;

    public SoilTestService(
            SoilTestRepository soilTestRepo,
            PlotRepository plotRepo) {
        this.soilTestRepo = soilTestRepo;
        this.plotRepo = plotRepo;
    }

    @Transactional
    public SoilTest add(Long plotId, SoilTest test) {
        Plot plot = plotRepo.findById(plotId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Plot not found with ID: " + plotId));

        test.setId(null);
        test.setPlot(plot);

        return soilTestRepo.save(test);
    }

    @Transactional(readOnly = true)
    public List<SoilTest> listByPlot(Long plotId) {
        if (!plotRepo.existsById(plotId)) {
            throw new ResourceNotFoundException("Plot not found with ID: " + plotId);
        }

        return soilTestRepo.findByPlot_IdOrderByTestDateDesc(plotId);
    }

    @Transactional(readOnly = true)
    public SoilTest getById(Long id) {
        return soilTestRepo.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Soil test not found with ID: " + id));
    }

    @Transactional
    public SoilTest update(Long id, SoilTest updated) {
        SoilTest existing = getById(id);
        existing.setTestDate(updated.getTestDate());
        existing.setPh(updated.getPh());
        existing.setNitrogen(updated.getNitrogen());
        existing.setPhosphorus(updated.getPhosphorus());
        existing.setPotassium(updated.getPotassium());
        existing.setNotes(updated.getNotes());
        return soilTestRepo.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        SoilTest test = getById(id);
        soilTestRepo.delete(test);
    }
}
