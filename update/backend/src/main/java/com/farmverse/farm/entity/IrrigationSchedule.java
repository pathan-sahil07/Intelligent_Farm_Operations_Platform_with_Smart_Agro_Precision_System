package com.farmverse.farm.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "irrigation_schedules")
@Getter @Setter @NoArgsConstructor
public class IrrigationSchedule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "farm_id")
    @JsonProperty("farm_id")
    private Long farmId;
    @Column(name = "plot_id")
    @JsonProperty("plot_id")
    private Long plotId;

    @ManyToOne(optional = false) @JoinColumn(name = "crop_id")
    @JsonIgnore
    private Crop crop;
    @Transient
    @JsonProperty("crop_id")
    private Long requestedCropId;

    @NotNull @Column(name = "scheduled_date")
    @JsonProperty("scheduled_date")
    private LocalDate scheduledDate;
    @Column(name = "scheduled_time")
    @JsonProperty("scheduled_time")
    private LocalTime scheduledTime;
    @NotNull @Positive @Column(name = "water_liters", precision = 12, scale = 2)
    @JsonProperty("water_liters")
    private BigDecimal waterLiters;
    private String method = "Drip";
    private String status = "Scheduled";
    private String notes;
    @Column(name = "completed_at")
    @JsonProperty("completed_at")
    private LocalDateTime completedAt;
    @Column(name = "created_at")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("crop_id")
    public Long getCropId() { return crop == null ? requestedCropId : crop.getId(); }
    @JsonProperty("crop_name")
    public String getCropName() { return crop == null ? null : crop.getName(); }
    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }
}
