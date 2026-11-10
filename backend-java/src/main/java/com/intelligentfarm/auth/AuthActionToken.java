package com.intelligentfarm.auth;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record AuthActionToken(
        UUID id,
        UUID accountId,
        AuthActionType type,
        String tokenHash,
        Instant createdAt,
        Instant expiresAt,
        Instant consumedAt) {

    public AuthActionToken {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(accountId, "accountId");
        Objects.requireNonNull(type, "type");
        Objects.requireNonNull(tokenHash, "tokenHash");
        Objects.requireNonNull(createdAt, "createdAt");
        Objects.requireNonNull(expiresAt, "expiresAt");
        if (tokenHash.isBlank() || !expiresAt.isAfter(createdAt)) {
            throw new IllegalArgumentException("Invalid action token");
        }
    }

    public boolean isUsableAt(Instant now) {
        return consumedAt == null && expiresAt.isAfter(now);
    }
}
