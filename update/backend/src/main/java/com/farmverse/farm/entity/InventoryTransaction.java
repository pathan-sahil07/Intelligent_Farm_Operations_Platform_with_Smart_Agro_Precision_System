package com.farmverse.farm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
@Getter @Setter @NoArgsConstructor
public class InventoryTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "inventory_item_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private InventoryItem inventoryItem;
    @NotBlank private String transactionType;
    @NotNull @Positive private BigDecimal quantity;
    private String notes;
    @PositiveOrZero private BigDecimal unitCost;
    private Long supplierId;
    private Long cropId;
    private Long createdBy;
    private LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonProperty("inventoryItemId")
    public Long getInventoryItemId() { return inventoryItem == null ? null : inventoryItem.getId(); }

    @PrePersist
    void created() { createdAt = LocalDateTime.now(); }
}
