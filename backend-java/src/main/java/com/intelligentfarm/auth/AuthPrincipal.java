package com.intelligentfarm.auth;

import java.security.Principal;
import java.util.Objects;
import java.util.UUID;

public record AuthPrincipal(UUID accountId, String email, String fullName, FarmRole role)
        implements Principal {

    public AuthPrincipal {
        Objects.requireNonNull(accountId, "accountId");
        Objects.requireNonNull(email, "email");
        Objects.requireNonNull(role, "role");
    }

    @Override
    public String getName() {
        return email;
    }
}
