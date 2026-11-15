package com.farmverse.farm.controller;

import com.farmverse.farm.entity.*;
import com.farmverse.farm.service.CropService;
import com.farmverse.farm.service.CropService.*;
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
public class CropController {
    private final CropService service;

    @GetMapping("/crops")
    @PreAuthorize("hasAuthority('CROP_READ')")
    public List<Crop> list(@RequestParam(required = false) Long farmId,
                           @RequestParam(required = false) String status,
                           @RequestParam(required = false) String q) {
        return service.list(farmId, status, q);
    }

    @GetMapping("/crops/{id}")
    @PreAuthorize("hasAuthority('CROP_READ')")
    public Crop get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/crops")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('CROP_WRITE')")
    public Crop create(@Valid @RequestBody CropRequest request) {
        return service.create(request);
    }

    @PutMapping("/crops/{id}")
    @PreAuthorize("hasAuthority('CROP_WRITE')")
    public Crop update(@PathVariable Long id, @Valid @RequestBody CropRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/crops/{id}")
    @PreAuthorize("hasAuthority('CROP_WRITE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/crops/{id}/stage")
    @PreAuthorize("hasAuthority('CROP_WRITE')")
    public Crop stage(@PathVariable Long id, @Valid @RequestBody StageRequest request) {
        return service.updateStage(id, request.growthStage());
    }

    @PostMapping("/crops/{id}/harvest")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('CROP_WRITE')")
    public HarvestRecord harvest(@PathVariable Long id, @Valid @RequestBody HarvestRequest request) {
        return service.harvest(id, request);
    }

    @GetMapping("/harvests")
    @PreAuthorize("hasAuthority('CROP_READ')")
    public List<HarvestRecord> harvests(@RequestParam(required = false) Long farmId,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.listHarvests(farmId, from, to);
    }

    @GetMapping("/crops/{id}/health")
    @PreAuthorize("hasAuthority('CROP_READ')")
    public List<CropHealthRecord> health(@PathVariable Long id) {
        return service.listHealth(id);
    }

    @PostMapping("/crops/{id}/health")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('CROP_WRITE')")
    public CropHealthRecord addHealth(@PathVariable Long id, @Valid @RequestBody HealthRequest request) {
        return service.addHealth(id, request);
    }

    @GetMapping("/crops/{id}/activities")
    @PreAuthorize("hasAuthority('CROP_READ')")
    public List<CropActivity> activities(@PathVariable Long id) {
        return service.listActivities(id);
    }

    @PostMapping("/crops/{id}/activities")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('CROP_WRITE')")
    public CropActivity addActivity(@PathVariable Long id, @Valid @RequestBody ActivityRequest request) {
        return service.addActivity(id, request);
    }
}
