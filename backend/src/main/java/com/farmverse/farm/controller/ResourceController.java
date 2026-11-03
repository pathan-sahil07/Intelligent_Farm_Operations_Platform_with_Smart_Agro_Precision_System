package com.farmverse.farm.controller;

import com.farmverse.farm.entity.FarmResource;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.FarmResourceRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {
    private final FarmResourceRepository resources;

    @GetMapping
    public List<FarmResource> list(@RequestParam(required = false) Long farmId) {
        return farmId == null ? resources.findAll() : resources.findByFarmIdOrderByNameAsc(farmId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FarmResource create(@Valid @RequestBody FarmResource resource) {
        resource.setId(null);
        return resources.save(resource);
    }

    @PatchMapping("/{id}/consume")
    @Transactional
    public FarmResource consume(@PathVariable Long id, @RequestParam BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) throw new BadRequestException("quantity must be positive");
        FarmResource resource = resources.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        BigDecimal remaining = resource.getPlannedQuantity().subtract(resource.getConsumedQuantity());
        if (remaining.compareTo(quantity) < 0) throw new BadRequestException("Consumption exceeds planned quantity");
        resource.setConsumedQuantity(resource.getConsumedQuantity().add(quantity));
        return resources.save(resource);
    }
}
