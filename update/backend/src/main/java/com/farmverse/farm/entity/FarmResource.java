package com.farmverse.farm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "resources")
@Getter @Setter @NoArgsConstructor
public class FarmResource {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long farmId;
    @NotBlank private String name;
    @NotBlank private String category;
    @NotBlank private String unit;
    @NotNull @PositiveOrZero private BigDecimal plannedQuantity;
    @NotNull @PositiveOrZero private BigDecimal consumedQuantity = BigDecimal.ZERO;
    @NotNull @PositiveOrZero private BigDecimal cost = BigDecimal.ZERO;
    private String season;
}
