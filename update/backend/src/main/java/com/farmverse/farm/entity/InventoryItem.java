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
@Table(name = "inventory_items")
@Getter @Setter @NoArgsConstructor
public class InventoryItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long farmId;
    @NotBlank private String name;
    @NotBlank private String category;
    @NotBlank private String unit;
    @NotNull @PositiveOrZero private BigDecimal quantity = BigDecimal.ZERO;
    @NotNull @PositiveOrZero private BigDecimal reorderLevel = BigDecimal.ZERO;
    @PositiveOrZero private BigDecimal unitCost;
    private LocalDate expiryDate;
    private Long supplierId;
    private LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonProperty("lowStock")
    public boolean isLowStock() {
        return reorderLevel != null && quantity != null && reorderLevel.signum() > 0 && quantity.compareTo(reorderLevel) <= 0;
    }

    @PrePersist
    void created() { createdAt = LocalDateTime.now(); }
}
