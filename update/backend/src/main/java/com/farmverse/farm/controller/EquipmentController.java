package com.farmverse.farm.controller;

import com.farmverse.farm.entity.Equipment;
import com.farmverse.farm.entity.EquipmentMaintenance;
import com.farmverse.farm.service.EquipmentService;
import com.farmverse.farm.service.EquipmentService.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {
    private final EquipmentService service;

    @GetMapping
    @PreAuthorize("hasAuthority('EQUIPMENT_READ')")
    public List<Equipment> list(@RequestParam(required = false) Long farmId,
                                @RequestParam(required = false) String status,
                                @RequestParam(required = false) String category) {
        return service.list(farmId, status, category);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('EQUIPMENT_WRITE')")
    public Equipment create(@Valid @RequestBody Equipment item) {
        return service.create(item);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EQUIPMENT_WRITE')")
    public Equipment update(@PathVariable Long id, @Valid @RequestBody Equipment item) {
        return service.update(id, item);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EQUIPMENT_WRITE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/allocate")
    @PreAuthorize("hasAuthority('EQUIPMENT_WRITE')")
    public Equipment allocate(@PathVariable Long id, @RequestBody AllocateRequest request) {
        return service.allocate(id, request);
    }

    @PostMapping("/{id}/release")
    @PreAuthorize("hasAuthority('EQUIPMENT_WRITE')")
    public Equipment release(@PathVariable Long id) {
        return service.release(id);
    }

    @PostMapping("/{id}/hours")
    @PreAuthorize("hasAuthority('EQUIPMENT_WRITE')")
    public Equipment hours(@PathVariable Long id, @Valid @RequestBody HoursRequest request) {
        return service.logHours(id, request);
    }

    @GetMapping("/{id}/maintenance")
    @PreAuthorize("hasAuthority('EQUIPMENT_READ')")
    public List<EquipmentMaintenance> history(@PathVariable Long id) {
        return service.history(id);
    }

    @PostMapping("/{id}/maintenance")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('EQUIPMENT_WRITE')")
    public EquipmentMaintenance schedule(@PathVariable Long id, @Valid @RequestBody EquipmentMaintenance record) {
        return service.scheduleMaintenance(id, record);
    }

    @PatchMapping("/maintenance/{maintenanceId}/complete")
    @PreAuthorize("hasAuthority('EQUIPMENT_WRITE')")
    public EquipmentMaintenance complete(@PathVariable Long maintenanceId, @Valid @RequestBody CompleteRequest request) {
        return service.completeMaintenance(maintenanceId, request);
    }

    @GetMapping("/maintenance/due")
    @PreAuthorize("hasAuthority('EQUIPMENT_READ')")
    public List<EquipmentMaintenance> due(@RequestParam(required = false) Long farmId,
                                          @RequestParam(defaultValue = "14") int days) {
        return service.due(farmId, days);
    }
}
