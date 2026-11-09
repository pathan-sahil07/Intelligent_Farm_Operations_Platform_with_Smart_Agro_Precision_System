package com.farmverse.farm.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "permissions")
@Getter @Setter @NoArgsConstructor
public class PermissionEntity {
    @Id
    private String code;

    private String description;

    public PermissionEntity(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
