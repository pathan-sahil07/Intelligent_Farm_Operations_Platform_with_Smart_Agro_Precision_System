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
@Table(name = "equipment")
@Getter @Setter @NoArgsConstructor
public class Equipment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long farmId;
    @NotBlank private String name;
    @NotBlank private String category;
    private String identifier;
    @NotBlank private String status = "AVAILABLE";
    private LocalDate purchaseDate;
    @PositiveOrZero private BigDecimal purchaseCost;
    private BigDecimal operatingHours = BigDecimal.ZERO;
    private Long allocatedToUserId;
    private Long allocatedToTaskId;
    private LocalDate nextMaintenanceDate;
    private LocalDateTime createdAt;

    @PrePersist
    void created() { createdAt = LocalDateTime.now(); }
}
