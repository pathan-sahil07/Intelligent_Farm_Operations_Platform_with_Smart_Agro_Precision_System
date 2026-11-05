package com.farmverse.farm.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/** Body of PUT /api/farms/{id}. The owner cannot be changed, so ownerId is not part of it. */
public record FarmUpdateRequest(
        @NotBlank(message = "Farm name is required") String name,
        String village,
        String district,
        String state,
        @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
        BigDecimal latitude,
        @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
        BigDecimal longitude,
        @NotNull(message = "Total area is required")
        @Positive(message = "Total area must be greater than 0")
        BigDecimal totalAreaAcres) {
}
