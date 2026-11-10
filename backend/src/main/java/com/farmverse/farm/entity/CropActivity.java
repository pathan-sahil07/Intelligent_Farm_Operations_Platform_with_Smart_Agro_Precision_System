package com.farmverse.farm.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "crop_activities")
@Getter @Setter @NoArgsConstructor
public class CropActivity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long cropId;
    private String activityType;
    private LocalDate activityDate;
    private String productName;
    private Long inventoryItemId;
    private BigDecimal quantity;
    private String unit;
    private String notes;
    private Long recordedBy;
    private LocalDateTime createdAt;

    @PrePersist void created() { createdAt = LocalDateTime.now(); }
}
