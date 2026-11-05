package com.farmverse.farm.controller;

import com.farmverse.farm.entity.*;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CropOperationsController {
    private static final Set<String> STAGES = Set.of("Seedling", "Vegetative", "Flowering", "Fruiting", "Mature");
    private static final Set<String> IRRIGATION_STATUSES = Set.of("Scheduled", "Completed", "Skipped");
    private final CropRepository crops;
    private final IrrigationScheduleRepository irrigation;
    private final HarvestRecordRepository harvests;

    @GetMapping("/crops")
    public List<Crop> listCrops() { return crops.findAllByOrderByCreatedAtDesc(); }

    @PostMapping("/crops")
    @ResponseStatus(HttpStatus.CREATED)
    public Crop createCrop(@Valid @RequestBody Crop crop) {
        crop.setId(null);
        if (!STAGES.contains(crop.getGrowthStage())) throw new BadRequestException("Invalid growth_stage");
        return crops.save(crop);
    }

    @PatchMapping("/crops/{id}/stage")
    public Crop updateStage(@PathVariable Long id, @RequestBody Crop body) {
        if (!STAGES.contains(body.getGrowthStage())) throw new BadRequestException("Invalid growth_stage");
        Crop crop = getCrop(id);
        crop.setGrowthStage(body.getGrowthStage());
        return crops.save(crop);
    }

    @PostMapping("/crops/{id}/harvest")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public HarvestRecord recordHarvest(@PathVariable Long id, @Valid @RequestBody HarvestRecord body) {
        Crop crop = getCrop(id);
        if (!"Active".equals(crop.getStatus())) throw new ResourceNotFoundException("Active crop not found");
        body.setId(null);
        body.setCrop(crop);
        body.setCropName(crop.getName());
        crop.setStatus("Harvested");
        crops.save(crop);
        return harvests.save(body);
    }

    @GetMapping("/harvests")
    public List<HarvestRecord> listHarvests() { return harvests.findAllByOrderByHarvestDateDescIdDesc(); }

    @GetMapping("/irrigation")
    public List<IrrigationSchedule> listIrrigation() { return irrigation.findAllByOrderByScheduledDateAscScheduledTimeAsc(); }

    @PostMapping("/irrigation")
    @ResponseStatus(HttpStatus.CREATED)
    public IrrigationSchedule createIrrigation(@RequestBody IrrigationSchedule body) {
        Crop crop = getCrop(body.getCropId());
        if (!"Active".equals(crop.getStatus())) throw new BadRequestException("Active crop not found for crop_id");
        body.setId(null);
        body.setCrop(crop);
        return irrigation.save(body);
    }

    @PatchMapping("/irrigation/{id}/status")
    public IrrigationSchedule updateIrrigation(@PathVariable Long id, @RequestBody IrrigationSchedule body) {
        if (!IRRIGATION_STATUSES.contains(body.getStatus())) throw new BadRequestException("Invalid status");
        IrrigationSchedule item = irrigation.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Irrigation schedule not found"));
        item.setStatus(body.getStatus());
        item.setCompletedAt("Completed".equals(body.getStatus()) ? LocalDateTime.now() : null);
        return irrigation.save(item);
    }

    private Crop getCrop(Long id) {
        return crops.findById(id).orElseThrow(() -> new ResourceNotFoundException("Crop not found"));
    }
}
