package com.intelligentfarm.auth;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record Invitation(
        UUID id,
        String email,
        String fullName,
        FarmRole role,
        InvitationStatus status,
        String tokenHash,
        UUID createdBy,
        Instant createdAt,
        Instant expiresAt,
        Instant acceptedAt,
        UUID acceptedBy,
        String message) {

    public Invitation {
        Objects.requireNonNull(id, "id");
        email = Account.normalizeEmail(email);
        Objects.requireNonNull(role, "role");
        Objects.requireNonNull(status, "status");
        Objects.requireNonNull(tokenHash, "tokenHash");
        Objects.requireNonNull(createdBy, "createdBy");
        Objects.requireNonNull(createdAt, "createdAt");
        Objects.requireNonNull(expiresAt, "expiresAt");
        if (tokenHash.isBlank() || !expiresAt.isAfter(createdAt)) {
            throw new IllegalArgumentException("Invalid invitation");
        }
    }

    public boolean isPendingAt(Instant now) {
        return status == InvitationStatus.PENDING && expiresAt.isAfter(now);
    }
}
