package com.farmverse.farm.controller;

import com.farmverse.farm.dto.FarmSummaryResponse;
import com.farmverse.farm.dto.FarmUpdateRequest;
import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.service.FarmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;

    @PostMapping
    public ResponseEntity<Farm> create(@Valid @RequestBody Farm farm) {
        Farm createdFarm = farmService.create(farm);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdFarm);
    }

    // GET /api/farms, /api/farms?ownerId=3 (owner's farms) or /api/farms?workerId=7 (worker's farms)
    @GetMapping
    public List<Farm> list(
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) Long workerId) {
        return farmService.list(ownerId, workerId);
    }

    @GetMapping("/{id}")
    public Farm get(@PathVariable Long id) {
        return farmService.get(id);
    }

    @PutMapping("/{id}")
    public Farm update(
            @PathVariable Long id,
            @Valid @RequestBody FarmUpdateRequest request) {
        return farmService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        farmService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/summary")
    public FarmSummaryResponse summary(@PathVariable Long id) {
        return farmService.summary(id);
    }
}
