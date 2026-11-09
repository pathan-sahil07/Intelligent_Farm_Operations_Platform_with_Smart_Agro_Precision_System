package com.farmverse.farm.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Getter @Setter @NoArgsConstructor
public class RoleEntity {
    @Id
    private String name;

    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role"))
    @Column(name = "permission")
    private Set<String> permissions = new HashSet<>();

    public RoleEntity(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
