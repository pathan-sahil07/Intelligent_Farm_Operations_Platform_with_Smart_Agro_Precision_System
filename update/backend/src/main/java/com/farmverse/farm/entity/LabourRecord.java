package com.farmverse.farm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "labour_records")
@Getter @Setter @NoArgsConstructor
public class LabourRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotNull private Long farmId;
    @NotNull private Long userId;
    @NotNull private LocalDate workDate;
    @NotNull @Positive @DecimalMax("24") private BigDecimal hours;
    @NotNull @PositiveOrZero private BigDecimal hourlyRate;
    private Long taskId;
    @Size(max = 500) private String notes;
    private LocalDateTime createdAt;

    @Transient
    private String userName;

    @com.fasterxml.jackson.annotation.JsonProperty("cost")
    public BigDecimal getCost() {
        return hours == null || hourlyRate == null ? BigDecimal.ZERO : hours.multiply(hourlyRate);
    }

    @PrePersist void created() { createdAt = LocalDateTime.now(); }
}
