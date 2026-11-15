package com.farmverse.farm.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "crops")
@Getter @Setter @NoArgsConstructor
public class Crop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "farm_id")
    @JsonProperty("farm_id")
    private Long farmId;

    @Column(name = "plot_id")
    @JsonProperty("plot_id")
    private Long plotId;

    @NotBlank private String name;
    private String variety;

    @NotBlank
    @Column(name = "field_name")
    @JsonProperty("field_name")
    private String fieldName;

    @NotNull @Positive
    @Column(name = "area_acres", precision = 10, scale = 2)
    @JsonProperty("area_acres")
    private BigDecimal areaAcres;

    @NotNull
    @Column(name = "planting_date")
    @JsonProperty("planting_date")
    private LocalDate plantingDate;

    @Column(name = "expected_harvest_date")
    @JsonProperty("expected_harvest_date")
    private LocalDate expectedHarvestDate;

    @NotBlank
    @Column(name = "growth_stage")
    @JsonProperty("growth_stage")
    private String growthStage = "Seedling";

    private String status = "Active";
    private String notes;

    @Column(name = "created_at")
    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
