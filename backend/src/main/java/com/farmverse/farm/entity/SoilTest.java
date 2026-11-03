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

@Entity
@Getter @Setter @NoArgsConstructor
public class SoilTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "plot_id")
    @JsonIgnore
    private Plot plot;

    @NotNull(message = "Test date is required")
    @PastOrPresent(message = "Test date cannot be in the future")
    private LocalDate testDate;

    @DecimalMin(value = "0.0", message = "pH must be between 0 and 14")
    @DecimalMax(value = "14.0", message = "pH must be between 0 and 14")
    @Column(precision = 3, scale = 1)
    private BigDecimal ph;

    @PositiveOrZero(message = "Nitrogen cannot be negative")
    @Column(precision = 6, scale = 2)
    private BigDecimal nitrogen;

    @PositiveOrZero(message = "Phosphorus cannot be negative")
    @Column(precision = 6, scale = 2)
    private BigDecimal phosphorus;

    @PositiveOrZero(message = "Potassium cannot be negative")
    @Column(precision = 6, scale = 2)
    private BigDecimal potassium;

    @Column(length = 1000)
    private String notes;

    @JsonProperty("plotId")
    public Long getPlotId() { return plot != null ? plot.getId() : null; }
}
