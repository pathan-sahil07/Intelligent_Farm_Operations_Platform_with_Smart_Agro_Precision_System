package com.farmverse.farm.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "harvest_records")
@Getter @Setter @NoArgsConstructor
public class HarvestRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "crop_id")
    private Crop crop;
    @Column(name = "crop_name")
    @JsonProperty("crop_name")
    private String cropName;
    @NotNull @JsonProperty("harvest_date")
    private LocalDate harvestDate;
    @NotNull @PositiveOrZero @Column(name = "quantity_kg", precision = 12, scale = 2)
    @JsonProperty("quantity_kg")
    private BigDecimal quantityKg;
    private String quality;
    private String notes;
    @Column(name = "created_at") @JsonProperty("created_at")
    private LocalDateTime createdAt;
    @JsonProperty("crop_id")
    public Long getCropId() { return crop == null ? null : crop.getId(); }
    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }
}
