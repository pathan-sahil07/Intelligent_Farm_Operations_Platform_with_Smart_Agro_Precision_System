package com.farmverse.farm.user;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Seeds roles and permissions for the in-memory demo profile, where Flyway is disabled.
 * Production/PostgreSQL gets the same data from migration V4. Keep the two in sync.
 */
@Component
@Profile({"demo", "test"})
@Order(0)
public class RbacSeeder implements ApplicationRunner {
    private final RoleRepository roles;
    private final PermissionRepository permissions;

    public RbacSeeder(RoleRepository roles, PermissionRepository permissions) {
        this.roles = roles;
        this.permissions = permissions;
    }

    static final List<String> PERMISSIONS = List.of(
            "FARM_READ", "FARM_WRITE", "FARM_DELETE", "FARM_ASSIGN", "CROP_READ", "CROP_WRITE",
            "IRRIGATION_READ", "IRRIGATION_WRITE", "IRRIGATION_UPDATE", "INVENTORY_READ", "INVENTORY_WRITE",
            "EQUIPMENT_READ", "EQUIPMENT_WRITE", "RESOURCE_READ", "RESOURCE_WRITE", "TASK_READ", "TASK_WRITE",
            "TASK_UPDATE", "WEATHER_READ", "GIS_READ", "GIS_WRITE", "ANALYTICS_READ", "USER_MANAGE",
            "ROLE_MANAGE", "AUDIT_READ");

    static Map<String, Set<String>> matrix() {
        Set<String> admin = new LinkedHashSet<>(PERMISSIONS);
        Set<String> owner = new LinkedHashSet<>(PERMISSIONS);
        owner.removeAll(Set.of("USER_MANAGE", "ROLE_MANAGE", "AUDIT_READ"));
        Set<String> manager = new LinkedHashSet<>(owner);
        manager.remove("FARM_DELETE");
        Map<String, Set<String>> m = new LinkedHashMap<>();
        m.put(Roles.ADMIN, admin);
        m.put(Roles.FARM_OWNER, owner);
        m.put(Roles.FARM_MANAGER, manager);
        m.put(Roles.AGRONOMIST, Set.of("FARM_READ", "CROP_READ", "CROP_WRITE", "IRRIGATION_READ", "IRRIGATION_WRITE",
                "IRRIGATION_UPDATE", "INVENTORY_READ", "WEATHER_READ", "GIS_READ", "ANALYTICS_READ", "TASK_READ"));
        m.put(Roles.FIELD_WORKER, Set.of("FARM_READ", "CROP_READ", "IRRIGATION_READ", "IRRIGATION_UPDATE",
                "INVENTORY_READ", "EQUIPMENT_READ", "WEATHER_READ", "GIS_READ", "TASK_READ", "TASK_UPDATE"));
        return m;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (roles.count() > 0) {
            return;
        }
        PERMISSIONS.forEach(code -> permissions.save(new PermissionEntity(code, code)));
        matrix().forEach((name, perms) -> {
            RoleEntity role = new RoleEntity(name, name);
            role.getPermissions().addAll(perms);
            roles.save(role);
        });
    }
}
