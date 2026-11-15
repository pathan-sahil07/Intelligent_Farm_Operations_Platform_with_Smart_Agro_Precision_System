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
@Table(name = "tasks")
@Getter @Setter @NoArgsConstructor
public class Task {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotNull private Long farmId;
    @NotBlank @Size(max = 200) private String title;
    @Size(max = 2000) private String description;
    private String taskType;
    private Long assignedTo;
    private Long plotId;
    private Long cropId;
    private Long equipmentId;
    private LocalDate dueDate;
    private String status = "OPEN";
    @PositiveOrZero private BigDecimal estimatedCost;
    @PositiveOrZero private BigDecimal actualCost;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Transient
    private String assignedToName;

    @PrePersist void created() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = LocalDateTime.now(); }
}
