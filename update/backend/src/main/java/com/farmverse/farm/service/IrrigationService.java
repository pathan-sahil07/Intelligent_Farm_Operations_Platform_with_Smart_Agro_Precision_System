package com.farmverse.farm.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.*;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ConflictException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.*;
import com.farmverse.farm.security.CurrentUser;
import com.farmverse.farm.security.FarmAccessService;
import jakarta.validation.constraints.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class IrrigationService {
    public static final Set<String> STATUSES = Set.of("Scheduled", "Completed", "Skipped");
    /** Two irrigations of the same crop or plot closer than this are treated as a conflict. */
    static final Duration CONFLICT_WINDOW = Duration.ofMinutes(60);

    public record IrrigationRequest(
            @JsonProperty("crop_id") @NotNull Long cropId,
            @JsonProperty("plot_id") Long plotId,
            @JsonProperty("scheduled_date") @NotNull LocalDate scheduledDate,
            @JsonProperty("scheduled_time") LocalTime scheduledTime,
            @JsonProperty("water_liters") @NotNull @Positive BigDecimal waterLiters,
            String method, String notes) {
    }

    public record StatusRequest(@NotBlank String status) {
    }

    public record MoistureRequest(@NotNull LocalDate readingDate,
                                  @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal moisturePercent,
                                  String source) {
    }

    public record Recommendation(Long cropId, String cropName, Long plotId, String date, String recommendation,
                                 String reason, Double rainMm, Double rainProbability, Double tempMaxC) {
    }

    private final IrrigationScheduleRepository schedules;
    private final CropRepository crops;
    private final PlotRepository plots;
    private final SoilMoistureRepository moisture;
    private final FarmService farms;
    private final WeatherService weather;
    private final FarmAccessService access;
    private final AuditService audit;

    public IrrigationService(IrrigationScheduleRepository schedules, CropRepository crops, PlotRepository plots,
                             SoilMoistureRepository moisture, FarmService farms, WeatherService weather,
                             FarmAccessService access, AuditService audit) {
        this.schedules = schedules;
        this.crops = crops;
        this.plots = plots;
        this.moisture = moisture;
        this.farms = farms;
        this.weather = weather;
        this.access = access;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<IrrigationSchedule> list(Long farmId, String status, LocalDate from, LocalDate to) {
        FarmAccessService.Scope scope = access.scope(farmId);
        return schedules.search(scope.ids(), scope.legacy(), status == null || status.isBlank() ? "%" : status,
                from == null ? LocalDate.of(1970, 1, 1) : from, to == null ? LocalDate.of(2999, 1, 1) : to);
    }

    @Transactional
    public IrrigationSchedule create(IrrigationRequest req) {
        Crop crop = crops.findById(req.cropId()).orElseThrow(() -> new ResourceNotFoundException("Crop not found"));
        access.requireFarmOrLegacy(crop.getFarmId());
        if (!"Active".equals(crop.getStatus())) throw new BadRequestException("Active crop not found for crop_id");
        IrrigationSchedule s = new IrrigationSchedule();
        s.setCrop(crop);
        s.setFarmId(crop.getFarmId());
        apply(s, req, crop);
        s.setStatus("Scheduled");
        checkConflict(s, null);
        IrrigationSchedule saved = schedules.save(s);
        audit.log("CREATE", "IRRIGATION", saved.getId(), crop.getName() + " " + saved.getScheduledDate());
        return saved;
    }

    @Transactional
    public IrrigationSchedule update(Long id, IrrigationRequest req) {
        IrrigationSchedule s = load(id);
        if (!"Scheduled".equals(s.getStatus())) throw new BadRequestException("Only scheduled irrigation can be edited");
        if (!s.getCrop().getId().equals(req.cropId())) throw new BadRequestException("The crop of a schedule cannot be changed");
        apply(s, req, s.getCrop());
        checkConflict(s, id);
        audit.log("UPDATE", "IRRIGATION", id, null);
        return schedules.save(s);
    }

    @Transactional
    public void delete(Long id) {
        IrrigationSchedule s = load(id);
        schedules.delete(s);
        audit.log("DELETE", "IRRIGATION", id, null);
    }

    @Transactional
    public IrrigationSchedule updateStatus(Long id, String status) {
        if (!STATUSES.contains(status)) throw new BadRequestException("Invalid status");
        IrrigationSchedule s = load(id);
        s.setStatus(status);
        s.setCompletedAt("Completed".equals(status) ? LocalDateTime.now() : null);
        audit.log("STATUS", "IRRIGATION", id, status);
        return schedules.save(s);
    }

    // ---- soil moisture ----
    @Transactional(readOnly = true)
    public List<SoilMoistureReading> listMoisture(Long plotId) {
        return moisture.findByPlotIdOrderByReadingDateDescIdDesc(plotId);
    }

    @Transactional
    public SoilMoistureReading addMoisture(Long plotId, MoistureRequest req) {
        if (!plots.existsById(plotId)) throw new ResourceNotFoundException("Plot not found with ID: " + plotId);
        SoilMoistureReading r = new SoilMoistureReading();
        r.setPlotId(plotId);
        r.setReadingDate(req.readingDate());
        r.setMoisturePercent(req.moisturePercent());
        r.setSource(req.source());
        r.setRecordedBy(CurrentUser.find().map(u -> u.getId()).orElse(null));
        return moisture.save(r);
    }

    // ---- weather based recommendations ----
    @Transactional(readOnly = true)
    public List<Recommendation> recommendations(Long farmId) {
        access.requireAccess(farmId);
        var farm = farms.get(farmId);
        if (farm.getLatitude() == null || farm.getLongitude() == null) {
            throw new ConflictException("This farm has no coordinates; set its location first");
        }
        List<WeatherService.Day> days = weather.forecast(farm.getLatitude(), farm.getLongitude()).days();
        if (days.isEmpty()) throw new ConflictException("The weather provider returned no forecast");
        List<Recommendation> result = new ArrayList<>();
        for (Crop crop : crops.findByFarmIdAndStatus(farmId, "Active")) {
            Double soil = crop.getPlotId() == null ? null
                    : moisture.findFirstByPlotIdOrderByReadingDateDescIdDesc(crop.getPlotId())
                    .filter(r -> !r.getReadingDate().isBefore(LocalDate.now().minusDays(3)))
                    .map(r -> r.getMoisturePercent().doubleValue()).orElse(null);
            result.add(recommend(crop, days.get(0), days.size() > 1 ? days.get(1) : null, soil));
        }
        return result;
    }

    /** Pure decision rule, covered by unit tests. */
    static Recommendation recommend(Crop crop, WeatherService.Day today, WeatherService.Day tomorrow, Double soilMoisture) {
        double rain = today.precipitationMm() == null ? 0 : today.precipitationMm();
        double prob = today.precipitationProbability() == null ? 0 : today.precipitationProbability();
        double tomorrowRain = tomorrow == null || tomorrow.precipitationMm() == null ? 0 : tomorrow.precipitationMm();
        String decision;
        String reason;
        if (soilMoisture != null && soilMoisture >= 70) {
            decision = "SKIP";
            reason = "Soil moisture is already high (" + soilMoisture + "%).";
        } else if (rain >= 5 || prob >= 70) {
            decision = "SKIP";
            reason = "Rain expected today (" + rain + " mm, " + Math.round(prob) + "% probability).";
        } else if (tomorrowRain >= 10) {
            decision = "DELAY";
            reason = "Significant rain forecast tomorrow (" + tomorrowRain + " mm); wait before irrigating.";
        } else if (soilMoisture != null && soilMoisture < 30) {
            decision = "IRRIGATE";
            reason = "Soil moisture is low (" + soilMoisture + "%) and no rain is expected.";
        } else if (today.tempMaxC() != null && today.tempMaxC() >= 35) {
            decision = "IRRIGATE";
            reason = "High temperature (" + today.tempMaxC() + " °C) and no rain expected.";
        } else {
            decision = "IRRIGATE";
            reason = "No significant rain expected; routine irrigation is appropriate.";
        }
        return new Recommendation(crop.getId(), crop.getName(), crop.getPlotId(), today.date(), decision, reason,
                today.precipitationMm(), today.precipitationProbability(), today.tempMaxC());
    }

    /** Rejects a schedule when the same crop or plot already has a non-skipped irrigation within the window. */
    void checkConflict(IrrigationSchedule candidate, Long ignoreId) {
        if (candidate.getFarmId() == null) return;
        for (IrrigationSchedule other : schedules.findByFarmIdAndScheduledDate(candidate.getFarmId(), candidate.getScheduledDate())) {
            if (other.getId() != null && other.getId().equals(ignoreId)) continue;
            if ("Skipped".equals(other.getStatus())) continue;
            boolean sameCrop = other.getCrop().getId().equals(candidate.getCrop().getId());
            boolean samePlot = candidate.getPlotId() != null && candidate.getPlotId().equals(other.getPlotId());
            if (!sameCrop && !samePlot) continue;
            if (closeInTime(candidate.getScheduledTime(), other.getScheduledTime())) {
                throw new ConflictException("Conflicts with an existing irrigation schedule #" + other.getId() + " on "
                        + other.getScheduledDate() + (other.getScheduledTime() == null ? "" : " at " + other.getScheduledTime())
                        + " for the same " + (sameCrop ? "crop" : "plot"));
            }
        }
    }

    static boolean closeInTime(LocalTime a, LocalTime b) {
        if (a == null || b == null) return a == null && b == null;
        return Math.abs(Duration.between(a, b).toMinutes()) < CONFLICT_WINDOW.toMinutes();
    }

    private void apply(IrrigationSchedule s, IrrigationRequest req, Crop crop) {
        Long plotId = req.plotId() != null ? req.plotId() : crop.getPlotId();
        if (plotId != null) {
            Plot plot = plots.findById(plotId).orElseThrow(() -> new BadRequestException("Unknown plot_id"));
            if (crop.getFarmId() != null && !plot.getFarm().getId().equals(crop.getFarmId())) {
                throw new BadRequestException("The plot does not belong to the crop's farm");
            }
        }
        s.setPlotId(plotId);
        s.setScheduledDate(req.scheduledDate());
        s.setScheduledTime(req.scheduledTime());
        s.setWaterLiters(req.waterLiters());
        s.setMethod(req.method() == null || req.method().isBlank() ? "Drip" : req.method());
        s.setNotes(req.notes());
    }

    IrrigationSchedule load(Long id) {
        IrrigationSchedule s = schedules.findById(id).orElseThrow(() -> new ResourceNotFoundException("Irrigation schedule not found"));
        access.requireFarmOrLegacy(s.getFarmId());
        return s;
    }
}
