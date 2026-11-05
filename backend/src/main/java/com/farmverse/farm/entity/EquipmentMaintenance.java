package com.farmverse.farm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "equipment_maintenance")
@Getter @Setter @NoArgsConstructor
public class EquipmentMaintenance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "equipment_id")
    private Equipment equipment;
    @NotNull private LocalDate scheduledDate;
    private LocalDate completedDate;
    @NotBlank private String maintenanceType;
    @PositiveOrZero private BigDecimal cost;
    private String notes;
}
