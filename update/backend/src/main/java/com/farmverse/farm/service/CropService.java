package com.farmverse.farm.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.*;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.notification.NotificationService;
import com.farmverse.farm.repository.*;
import com.farmverse.farm.security.CurrentUser;
import com.farmverse.farm.security.FarmAccessService;
import jakarta.validation.constraints.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class CropService {
    public static final Set<String> STAGES = Set.of("Seedling", "Vegetative", "Flowering", "Fruiting", "Mature");
    static final Set<String> HEALTH = Set.of("HEALTHY", "STRESSED", "DISEASED", "PEST");
    static final Set<String> ACTIVITY = Set.of("FERTILIZER", "PESTICIDE", "OTHER");

    public record CropRequest(
            @NotBlank String name, String variety,
            @JsonProperty("farm_id") @NotNull Long farmId,
            @JsonProperty("plot_id") Long plotId,
            @JsonProperty("field_name") @NotBlank String fieldName,
            @JsonProperty("area_acres") @NotNull @Positive BigDecimal areaAcres,
            @JsonProperty("planting_date") @NotNull LocalDate plantingDate,
            @JsonProperty("expected_harvest_date") LocalDate expectedHarvestDate,
            @JsonProperty("growth_stage") String growthStage, String notes) {
    }

    public record StageRequest(@JsonProperty("growth_stage") @NotBlank String growthStage) {
    }

    public record HarvestRequest(
            @JsonProperty("harvest_date") @NotNull LocalDate harvestDate,
            @JsonProperty("quantity_kg") @NotNull @PositiveOrZero BigDecimal quantityKg,
            String quality, String notes) {
    }

    public record HealthRequest(@NotNull LocalDate recordDate, @NotBlank String status, String issue, String notes) {
    }

    public record ActivityRequest(@NotBlank String activityType, @NotNull LocalDate activityDate, String productName,
                                  Long inventoryItemId, @NotNull @PositiveOrZero BigDecimal quantity, String unit,
                                  String notes) {
    }

    private final CropRepository crops;
    private final HarvestRecordRepository harvests;
    private final CropHealthRecordRepository health;
    private final CropActivityRepository activities;
    private final PlotRepository plots;
    private final FarmAccessService access;
    private final InventoryService inventory;
    private final AuditService audit;
    private final NotificationService notifications;

    public CropService(CropRepository crops, HarvestRecordRepository harvests, CropHealthRecordRepository health,
                       CropActivityRepository activities, PlotRepository plots, FarmAccessService access,
                       InventoryService inventory, AuditService audit, NotificationService notifications) {
        this.crops = crops;
        this.harvests = harvests;
        this.health = health;
        this.activities = activities;
        this.plots = plots;
        this.access = access;
        this.inventory = inventory;
        this.audit = audit;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<Crop> list(Long farmId, String status, String q) {
        FarmAccessService.Scope scope = access.scope(farmId);
        String like = q == null || q.isBlank() ? "%" : "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
        return crops.search(scope.ids(), scope.legacy(), status == null || status.isBlank() ? "%" : status, like);
    }

    @Transactional(readOnly = true)
    public Crop get(Long id) {
        return load(id);
    }

    @Transactional
    public Crop create(CropRequest req) {
        access.requireAccess(req.farmId());
        Crop crop = new Crop();
        crop.setFarmId(req.farmId());
        apply(crop, req);
        crop.setStatus("Active");
        Crop saved = crops.save(crop);
        audit.log("CREATE", "CROP", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public Crop update(Long id, CropRequest req) {
        Crop crop = load(id);
        if (crop.getFarmId() != null && !crop.getFarmId().equals(req.farmId())) {
            throw new BadRequestException("A crop cannot be moved to another farm");
        }
        if (crop.getFarmId() == null) crop.setFarmId(req.farmId());
        access.requireAccess(crop.getFarmId());
        apply(crop, req);
        audit.log("UPDATE", "CROP", id, crop.getName());
        return crops.save(crop);
    }

    @Transactional
    public void delete(Long id) {
        Crop crop = load(id);
        crops.delete(crop);
        audit.log("DELETE", "CROP", id, crop.getName());
    }

    @Transactional
    public Crop updateStage(Long id, String stage) {
        if (!STAGES.contains(stage)) throw new BadRequestException("Invalid growth_stage");
        Crop crop = load(id);
        crop.setGrowthStage(stage);
        audit.log("STAGE", "CROP", id, stage);
        return crops.save(crop);
    }

    @Transactional
    public HarvestRecord harvest(Long id, HarvestRequest req) {
        Crop crop = load(id);
        if (!"Active".equals(crop.getStatus())) throw new ResourceNotFoundException("Active crop not found");
        HarvestRecord record = new HarvestRecord();
        record.setCrop(crop);
        record.setFarmId(crop.getFarmId());
        record.setCropName(crop.getName());
        record.setHarvestDate(req.harvestDate());
        record.setQuantityKg(req.quantityKg());
        record.setQuality(req.quality());
        record.setNotes(req.notes());
        crop.setStatus("Harvested");
        crops.save(crop);
        HarvestRecord saved = harvests.save(record);
        audit.log("HARVEST", "CROP", id, req.quantityKg().toPlainString() + " kg");
        if (crop.getFarmId() != null) {
            notifications.notifyFarm(crop.getFarmId(), "ACTIVITY", "Harvest recorded: " + crop.getName(),
                    req.quantityKg().toPlainString() + " kg harvested.", "/crops", "harvest-rec:" + saved.getId());
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public List<HarvestRecord> listHarvests(Long farmId, LocalDate from, LocalDate to) {
        FarmAccessService.Scope scope = access.scope(farmId);
        return harvests.search(scope.ids(), scope.legacy(), from == null ? LocalDate.of(1970, 1, 1) : from,
                to == null ? LocalDate.of(2999, 1, 1) : to);
    }

    // ---- health ----
    @Transactional(readOnly = true)
    public List<CropHealthRecord> listHealth(Long cropId) {
        load(cropId);
        return health.findByCropIdOrderByRecordDateDescIdDesc(cropId);
    }

    @Transactional
    public CropHealthRecord addHealth(Long cropId, HealthRequest req) {
        Crop crop = load(cropId);
        if (!HEALTH.contains(req.status())) throw new BadRequestException("status must be one of " + HEALTH);
        CropHealthRecord r = new CropHealthRecord();
        r.setCropId(cropId);
        r.setRecordDate(req.recordDate());
        r.setStatus(req.status());
        r.setIssue(req.issue());
        r.setNotes(req.notes());
        r.setRecordedBy(CurrentUser.find().map(u -> u.getId()).orElse(null));
        CropHealthRecord saved = health.save(r);
        audit.log("HEALTH", "CROP", cropId, req.status());
        if (!"HEALTHY".equals(req.status()) && crop.getFarmId() != null) {
            notifications.notifyFarm(crop.getFarmId(), "ACTIVITY", "Crop health issue: " + crop.getName(),
                    req.status() + (req.issue() == null ? "" : " - " + req.issue()), "/crops", "health:" + saved.getId());
        }
        return saved;
    }

    // ---- activities (fertilizer / pesticide), optionally consuming inventory ----
    @Transactional(readOnly = true)
    public List<CropActivity> listActivities(Long cropId) {
        load(cropId);
        return activities.findByCropIdOrderByActivityDateDescIdDesc(cropId);
    }

    @Transactional
    public CropActivity addActivity(Long cropId, ActivityRequest req) {
        Crop crop = load(cropId);
        if (!ACTIVITY.contains(req.activityType())) throw new BadRequestException("activityType must be one of " + ACTIVITY);
        CropActivity a = new CropActivity();
        a.setCropId(cropId);
        a.setActivityType(req.activityType());
        a.setActivityDate(req.activityDate());
        a.setProductName(req.productName());
        a.setInventoryItemId(req.inventoryItemId());
        a.setQuantity(req.quantity());
        a.setUnit(req.unit());
        a.setNotes(req.notes());
        a.setRecordedBy(CurrentUser.find().map(u -> u.getId()).orElse(null));
        if (req.inventoryItemId() != null) {
            if (req.quantity().signum() <= 0) throw new BadRequestException("quantity must be positive when using inventory");
            inventory.consume(req.inventoryItemId(), req.quantity(), cropId, crop.getFarmId(),
                    req.activityType() + " on " + crop.getName());
        }
        CropActivity saved = activities.save(a);
        audit.log("ACTIVITY", "CROP", cropId, req.activityType() + " " + req.quantity().toPlainString());
        return saved;
    }

    Crop load(Long id) {
        Crop crop = crops.findById(id).orElseThrow(() -> new ResourceNotFoundException("Crop not found"));
        access.requireFarmOrLegacy(crop.getFarmId());
        return crop;
    }

    private void apply(Crop crop, CropRequest req) {
        String stage = req.growthStage() == null || req.growthStage().isBlank() ? "Seedling" : req.growthStage();
        if (!STAGES.contains(stage)) throw new BadRequestException("Invalid growth_stage");
        if (req.expectedHarvestDate() != null && req.expectedHarvestDate().isBefore(req.plantingDate())) {
            throw new BadRequestException("expected_harvest_date cannot be before planting_date");
        }
        if (req.plotId() != null) {
            Plot plot = plots.findById(req.plotId()).orElseThrow(() -> new BadRequestException("Unknown plot_id"));
            if (!plot.getFarm().getId().equals(req.farmId())) {
                throw new BadRequestException("The plot does not belong to this farm");
            }
        }
        crop.setName(req.name().trim());
        crop.setVariety(req.variety());
        crop.setPlotId(req.plotId());
        crop.setFieldName(req.fieldName().trim());
        crop.setAreaAcres(req.areaAcres());
        crop.setPlantingDate(req.plantingDate());
        crop.setExpectedHarvestDate(req.expectedHarvestDate());
        crop.setGrowthStage(stage);
        crop.setNotes(req.notes());
    }
}
