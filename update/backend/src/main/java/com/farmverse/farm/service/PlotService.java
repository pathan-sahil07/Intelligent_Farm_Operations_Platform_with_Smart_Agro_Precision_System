
package com.farmverse.farm.service;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.Plot;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.FarmRepository;
import com.farmverse.farm.repository.PlotRepository;
import com.farmverse.farm.repository.SoilTestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PlotService {

    private final PlotRepository plotRepo;
    private final FarmRepository farmRepo;
    private final SoilTestRepository soilTestRepo;

    public PlotService(
            PlotRepository plotRepo,
            FarmRepository farmRepo,
            SoilTestRepository soilTestRepo) {
        this.plotRepo = plotRepo;
        this.farmRepo = farmRepo;
        this.soilTestRepo = soilTestRepo;
    }

    @Transactional
    public Plot create(Long farmId, Plot plot) {
        Farm farm = farmRepo.findById(farmId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Farm not found with ID: " + farmId));

        plot.setId(null); // never let a client overwrite an existing plot via POST
        plot.setName(plot.getName().trim());
        if (plotRepo.existsByFarm_IdAndNameIgnoreCase(farmId, plot.getName())) {
            throw new BadRequestException(
                    "A plot named '" + plot.getName() + "' already exists in this farm");
        }

        checkAreaFits(farm, plot.getAreaAcres());
        plot.setFarm(farm);

        return plotRepo.save(plot);
    }

    @Transactional(readOnly = true)
    public List<Plot> listByFarm(Long farmId) {
        if (!farmRepo.existsById(farmId)) {
            throw new ResourceNotFoundException("Farm not found with ID: " + farmId);
        }

        return plotRepo.findByFarm_Id(farmId);
    }

    @Transactional(readOnly = true)
    public Plot get(Long id) {
        return plotRepo.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Plot not found with ID: " + id));
    }

    @Transactional
    public Plot update(Long id, Plot updatedPlot) {
        Plot existingPlot = get(id);

        Farm farm = existingPlot.getFarm();
        BigDecimal currentArea = existingPlot.getAreaAcres();
        BigDecimal updatedArea = updatedPlot.getAreaAcres();

        if (updatedArea == null || updatedArea.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Plot area must be greater than zero");
        }

        String newName = updatedPlot.getName().trim();
        if (plotRepo.existsByFarm_IdAndNameIgnoreCaseAndIdNot(farm.getId(), newName, id)) {
            throw new BadRequestException(
                    "A plot named '" + newName + "' already exists in this farm");
        }

        BigDecimal totalFarmArea = farm.getTotalAreaAcres();
        if (totalFarmArea != null) {
            BigDecimal existingTotal = plotRepo.sumAreaByFarmId(farm.getId());
            if (existingTotal == null) {
                existingTotal = BigDecimal.ZERO;
            }
            BigDecimal oldArea = currentArea == null ? BigDecimal.ZERO : currentArea;
            BigDecimal newTotal = existingTotal.subtract(oldArea).add(updatedArea);
            if (newTotal.compareTo(totalFarmArea) > 0) {
                throw new BadRequestException(
                        "Total plot area cannot exceed farm area");
            }
        }

        existingPlot.setName(newName);
        existingPlot.setAreaAcres(updatedPlot.getAreaAcres());
        existingPlot.setSoilType(updatedPlot.getSoilType());

        return plotRepo.save(existingPlot);
    }

    @Transactional
    public void delete(Long id) {
        Plot plot = get(id);

        soilTestRepo.deleteByPlot_Id(id);
        plotRepo.delete(plot);
    }

    private void checkAreaFits(Farm farm, BigDecimal newArea) {
        if (newArea == null || newArea.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Plot area must be greater than zero");
        }

        BigDecimal totalFarmArea = farm.getTotalAreaAcres();

        if (totalFarmArea == null) {
            return;
        }

        BigDecimal existingArea = plotRepo.sumAreaByFarmId(farm.getId());

        if (existingArea == null) {
            existingArea = BigDecimal.ZERO;
        }

        if (existingArea.add(newArea).compareTo(totalFarmArea) > 0) {
            throw new BadRequestException(
                    "Total plot area cannot exceed farm area");
        }
    }
}
