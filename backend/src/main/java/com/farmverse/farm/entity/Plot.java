package com.farmverse.farm.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter @Setter @NoArgsConstructor
public class Plot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "farm_id")
    @JsonIgnore
    private Farm farm;

    @NotBlank(message = "Plot name is required")
    private String name;

    @NotNull(message = "Plot area is required")
    @Positive(message = "Plot area must be greater than 0")
    @Column(precision = 10, scale = 2)
    private BigDecimal areaAcres;

    /** e.g. red, black, loamy, sandy */
    private String soilType;

    @JsonProperty("farmId")
    public Long getFarmId() { return farm != null ? farm.getId() : null; }
}
