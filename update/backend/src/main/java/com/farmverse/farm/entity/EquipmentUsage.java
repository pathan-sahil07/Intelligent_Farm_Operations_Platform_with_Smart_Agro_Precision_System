package com.farmverse.farm.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment_usage")
@Getter @Setter @NoArgsConstructor
public class EquipmentUsage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long equipmentId;
    private LocalDate usageDate;
    private BigDecimal hours;
    private String notes;
    private Long recordedBy;
    private LocalDateTime createdAt;

    @PrePersist void created() { createdAt = LocalDateTime.now(); }
}
