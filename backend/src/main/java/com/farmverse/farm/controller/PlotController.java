package com.farmverse.farm.controller;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.Plot;
import com.farmverse.farm.entity.SoilTest;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.service.PlotService;
import com.farmverse.farm.service.SoilTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PlotController {

    private final PlotService plotService;
    private final SoilTestService soilTestService;
    private final FarmAccessService access;
    private final AuditService audit;

    // ---- Plots ----

    @PostMapping("/farms/{farmId}/plots")
    @PreAuthorize("hasAuthority('FARM_WRITE')")
    public ResponseEntity<Plot> createPlot(@PathVariable Long farmId, @Valid @RequestBody Plot plot) {
        access.requireAccess(farmId);
        Plot created = plotService.create(farmId, plot);
        audit.log("CREATE", "PLOT", created.getId(), created.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/farms/{farmId}/plots")
    @PreAuthorize("hasAuthority('FARM_READ')")
    public List<Plot> listPlots(@PathVariable Long farmId) {
        access.requireAccess(farmId);
        return plotService.listByFarm(farmId);
    }

    @GetMapping("/plots/{id}")
    @PreAuthorize("hasAuthority('FARM_READ')")
    public Plot getPlot(@PathVariable Long id) {
        access.requirePlotAccess(id);
        return plotService.get(id);
    }

    @PutMapping("/plots/{id}")
    @PreAuthorize("hasAuthority('FARM_WRITE')")
    public Plot updatePlot(@PathVariable Long id, @Valid @RequestBody Plot plot) {
        access.requirePlotAccess(id);
        Plot updated = plotService.update(id, plot);
        audit.log("UPDATE", "PLOT", id, updated.getName());
        return updated;
    }

    @DeleteMapping("/plots/{id}")
    @PreAuthorize("hasAuthority('FARM_WRITE')")
    public ResponseEntity<Void> deletePlot(@PathVariable Long id) {
        access.requirePlotAccess(id);
        plotService.delete(id);
        audit.log("DELETE", "PLOT", id, null);
        return ResponseEntity.noContent().build();
    }

    // ---- Soil tests ----

    @PostMapping("/plots/{plotId}/soil-tests")
    @PreAuthorize("hasAuthority('FARM_WRITE')")
    public ResponseEntity<SoilTest> addSoilTest(@PathVariable Long plotId, @Valid @RequestBody SoilTest test) {
        access.requirePlotAccess(plotId);
        return ResponseEntity.status(HttpStatus.CREATED).body(soilTestService.add(plotId, test));
    }

    @GetMapping("/plots/{plotId}/soil-tests")
    @PreAuthorize("hasAuthority('FARM_READ')")
    public List<SoilTest> listSoilTests(@PathVariable Long plotId) {
        access.requirePlotAccess(plotId);
        return soilTestService.listByPlot(plotId);
    }

    @GetMapping("/soil-tests/{id}")
    @PreAuthorize("hasAuthority('FARM_READ')")
    public SoilTest getSoilTest(@PathVariable Long id) {
        access.requireSoilTestAccess(id);
        return soilTestService.getById(id);
    }

    @PutMapping("/soil-tests/{id}")
    @PreAuthorize("hasAuthority('FARM_WRITE')")
    public SoilTest updateSoilTest(@PathVariable Long id, @Valid @RequestBody SoilTest test) {
        access.requireSoilTestAccess(id);
        return soilTestService.update(id, test);
    }

    @DeleteMapping("/soil-tests/{id}")
    @PreAuthorize("hasAuthority('FARM_WRITE')")
    public ResponseEntity<Void> deleteSoilTest(@PathVariable Long id) {
        access.requireSoilTestAccess(id);
        soilTestService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
