package com.farmverse.farm.controller;

import com.farmverse.farm.entity.IrrigationSchedule;
import com.farmverse.farm.entity.SoilMoistureReading;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.service.IrrigationService;
import com.farmverse.farm.service.IrrigationService.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class IrrigationController {
    private final IrrigationService service;
    private final FarmAccessService access;

    @GetMapping("/irrigation")
    @PreAuthorize("hasAuthority('IRRIGATION_READ')")
    public List<IrrigationSchedule> list(@RequestParam(required = false) Long farmId,
                                         @RequestParam(required = false) String status,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.list(farmId, status, from, to);
    }

    @PostMapping("/irrigation")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('IRRIGATION_WRITE')")
    public IrrigationSchedule create(@Valid @RequestBody IrrigationRequest request) {
        return service.create(request);
    }

    @PutMapping("/irrigation/{id}")
    @PreAuthorize("hasAuthority('IRRIGATION_WRITE')")
    public IrrigationSchedule update(@PathVariable Long id, @Valid @RequestBody IrrigationRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/irrigation/{id}")
    @PreAuthorize("hasAuthority('IRRIGATION_WRITE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/irrigation/{id}/status")
    @PreAuthorize("hasAuthority('IRRIGATION_UPDATE')")
    public IrrigationSchedule status(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return service.updateStatus(id, request.status());
    }

    @GetMapping("/irrigation/recommendations")
    @PreAuthorize("hasAuthority('IRRIGATION_READ') and hasAuthority('WEATHER_READ')")
    public List<Recommendation> recommendations(@RequestParam Long farmId) {
        return service.recommendations(farmId);
    }

    @GetMapping("/plots/{plotId}/soil-moisture")
    @PreAuthorize("hasAuthority('IRRIGATION_READ')")
    public List<SoilMoistureReading> moisture(@PathVariable Long plotId) {
        access.requirePlotAccess(plotId);
        return service.listMoisture(plotId);
    }

    @PostMapping("/plots/{plotId}/soil-moisture")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('IRRIGATION_WRITE')")
    public SoilMoistureReading addMoisture(@PathVariable Long plotId, @Valid @RequestBody MoistureRequest request) {
        access.requirePlotAccess(plotId);
        return service.addMoisture(plotId, request);
    }
}
