package com.farmverse.farm.controller;

import com.farmverse.farm.entity.Equipment;
import com.farmverse.farm.entity.EquipmentMaintenance;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.EquipmentMaintenanceRepository;
import com.farmverse.farm.repository.EquipmentRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {
    private final EquipmentRepository equipment;
    private final EquipmentMaintenanceRepository maintenance;

    @GetMapping
    public List<Equipment> list(@RequestParam(required = false) Long farmId) {
        return farmId == null ? equipment.findAll() : equipment.findByFarmIdOrderByNameAsc(farmId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Equipment create(@Valid @RequestBody Equipment item) {
        item.setId(null);
        return equipment.save(item);
    }

    @PostMapping("/{id}/maintenance")
    @ResponseStatus(HttpStatus.CREATED)
    public EquipmentMaintenance schedule(@PathVariable Long id, @Valid @RequestBody EquipmentMaintenance record) {
        Equipment item = equipment.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));
        record.setId(null);
        record.setEquipment(item);
        return maintenance.save(record);
    }

    @GetMapping("/{id}/maintenance")
    public List<EquipmentMaintenance> history(@PathVariable Long id) {
        if (!equipment.existsById(id)) throw new ResourceNotFoundException("Equipment not found");
        return maintenance.findByEquipmentIdOrderByScheduledDateDesc(id);
    }
}
