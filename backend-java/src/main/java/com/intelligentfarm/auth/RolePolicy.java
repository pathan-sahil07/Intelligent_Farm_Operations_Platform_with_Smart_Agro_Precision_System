package com.intelligentfarm.auth;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;

public final class RolePolicy {

    private RolePolicy() {
    }

    public static Set<FarmRole> invitationRolesFor(FarmRole inviterRole) {
        return switch (inviterRole) {
            case FARM_OWNER -> Set.of(FarmRole.FARM_MANAGER, FarmRole.FARMER, FarmRole.FIELD_WORKER);
            case FARM_MANAGER -> Set.of(FarmRole.FARMER, FarmRole.FIELD_WORKER);
            case FARMER, FIELD_WORKER -> Set.of();
        };
    }

    public static List<String> permissionsFor(FarmRole role) {
        List<String> permissions = new ArrayList<>();
        permissions.add("profile:read");
        for (FarmRole inviteRole : invitationRolesFor(role)) {
            permissions.add("invitations:create:" + inviteRole.name());
        }
        if (!invitationRolesFor(role).isEmpty()) {
            permissions.add("invitations:read");
            permissions.add("invitations:resend");
            permissions.add("invitations:revoke");
        }
        return List.copyOf(permissions);
    }

    public static List<GrantedAuthority> authoritiesFor(FarmRole role) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        for (String permission : permissionsFor(role)) {
            authorities.add(new SimpleGrantedAuthority("PERM_" + permission));
        }
        return List.copyOf(authorities);
    }
}
