
package com.farmverse.farm.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class LandDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "farm_id")
    @JsonIgnore
    private Farm farm;

    // Example: passbook, survey map, sale deed
    private String docType;

    // Original file name shown to the user
    private String fileName;

    // Server-side file storage path; not sent to the client
    @JsonIgnore
    private String filePath;

    private LocalDateTime uploadedAt;

    @PrePersist
    void onCreate() {
        uploadedAt = LocalDateTime.now();
    }

    @JsonProperty("farmId")
    public Long getFarmId() {
        return farm != null ? farm.getId() : null;
    }
}
