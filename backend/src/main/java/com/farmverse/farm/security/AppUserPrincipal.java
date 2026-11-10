package com.farmverse.farm.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;

/** Authenticated caller, rebuilt from the database on every request so admin changes apply immediately. */
@Getter
public class AppUserPrincipal implements UserDetails {
    private final Long id;
    private final String email;
    private final String fullName;
    private final String role;
    private final boolean active;
    private final List<GrantedAuthority> authorities;

    public AppUserPrincipal(Long id, String email, String fullName, String role, boolean active,
                            Set<String> permissions) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.active = active;
        List<GrantedAuthority> list = new java.util.ArrayList<>();
        list.add(new SimpleGrantedAuthority("ROLE_" + role));
        permissions.forEach(p -> list.add(new SimpleGrantedAuthority(p)));
        this.authorities = List.copyOf(list);
    }

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
