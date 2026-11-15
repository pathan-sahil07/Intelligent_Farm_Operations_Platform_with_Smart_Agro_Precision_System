package com.farmverse.farm.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "crop_health_records")
@Getter @Setter @NoArgsConstructor
public class CropHealthRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long cropId;
    private LocalDate recordDate;
    private String status;
    private String issue;
    private String notes;
    private Long recordedBy;
    private LocalDateTime createdAt;

    @PrePersist void created() { createdAt = LocalDateTime.now(); }
}
