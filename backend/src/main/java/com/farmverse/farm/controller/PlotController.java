
package com.farmverse.farm.controller;

import com.farmverse.farm.entity.Plot;
import com.farmverse.farm.entity.SoilTest;
import com.farmverse.farm.service.PlotService;
import com.farmverse.farm.service.SoilTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PlotController {

    private final PlotService plotService;
    private final SoilTestService soilTestService;

    // ---- Plots ----

    @PostMapping("/farms/{farmId}/plots")
    public ResponseEntity<Plot> createPlot(
            @PathVariable Long farmId,
            @Valid @RequestBody Plot plot) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(plotService.create(farmId, plot));
    }

    @GetMapping("/farms/{farmId}/plots")
    public List<Plot> listPlots(@PathVariable Long farmId) {
        return plotService.listByFarm(farmId);
    }

    @GetMapping("/plots/{id}")
    public Plot getPlot(@PathVariable Long id) {
        return plotService.get(id);
    }

    @PutMapping("/plots/{id}")
    public Plot updatePlot(
            @PathVariable Long id,
            @Valid @RequestBody Plot plot) {
        return plotService.update(id, plot);
    }

    @DeleteMapping("/plots/{id}")
    public ResponseEntity<Void> deletePlot(@PathVariable Long id) {
        plotService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Soil tests ----

    @PostMapping("/plots/{plotId}/soil-tests")
    public ResponseEntity<SoilTest> addSoilTest(
            @PathVariable Long plotId,
            @Valid @RequestBody SoilTest test) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(soilTestService.add(plotId, test));
    }

    @GetMapping("/plots/{plotId}/soil-tests")
    public List<SoilTest> listSoilTests(@PathVariable Long plotId) {
        return soilTestService.listByPlot(plotId);
    }

    @GetMapping("/soil-tests/{id}")
    public SoilTest getSoilTest(@PathVariable Long id) {
        return soilTestService.getById(id);
    }

    @PutMapping("/soil-tests/{id}")
    public SoilTest updateSoilTest(
            @PathVariable Long id,
            @Valid @RequestBody SoilTest test) {
        return soilTestService.update(id, test);
    }

    @DeleteMapping("/soil-tests/{id}")
    public ResponseEntity<Void> deleteSoilTest(@PathVariable Long id) {
        soilTestService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
