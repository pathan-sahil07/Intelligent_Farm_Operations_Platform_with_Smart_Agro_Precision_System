package com.intelligentfarm.auth;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public final class Session {

    private final UUID id;
    private final SessionKind kind;
    private final String tokenHash;
    private final String csrfTokenHash;
    private final Instant createdAt;
    private final Instant lastActivityAt;
    private final Instant absoluteExpiresAt;
    private final Instant revokedAt;
    private final UUID accountId;
    private final Long authVersion;

    public Session(
            UUID id,
            SessionKind kind,
            String tokenHash,
            String csrfTokenHash,
            Instant createdAt,
            Instant lastActivityAt,
            Instant absoluteExpiresAt,
            Instant revokedAt,
            UUID accountId,
            Long authVersion) {
        this.id = Objects.requireNonNull(id, "id");
        this.kind = Objects.requireNonNull(kind, "kind");
        this.tokenHash = requireNonBlank(tokenHash, "tokenHash");
        this.csrfTokenHash = requireNonBlank(csrfTokenHash, "csrfTokenHash");
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
        this.lastActivityAt = Objects.requireNonNull(lastActivityAt, "lastActivityAt");
        this.absoluteExpiresAt = Objects.requireNonNull(absoluteExpiresAt, "absoluteExpiresAt");
        this.revokedAt = revokedAt;
        this.accountId = accountId;
        this.authVersion = authVersion;

        validateTimestamps();
        validateIdentity();
    }

    private static String requireNonBlank(String value, String name) {
        Objects.requireNonNull(value, name);
        if (value.isBlank()) {
            throw new IllegalArgumentException(name + " must not be blank");
        }
        return value;
    }

    private void validateTimestamps() {
        if (!absoluteExpiresAt.isAfter(createdAt)) {
            throw new IllegalArgumentException("absoluteExpiresAt must be after createdAt");
        }
        if (lastActivityAt.isBefore(createdAt) || lastActivityAt.isAfter(absoluteExpiresAt)) {
            throw new IllegalArgumentException(
                    "lastActivityAt must be between createdAt and absoluteExpiresAt");
        }
        if (revokedAt != null && revokedAt.isBefore(createdAt)) {
            throw new IllegalArgumentException("revokedAt must not be before createdAt");
        }
    }

    private void validateIdentity() {
        if (kind == SessionKind.PRE_AUTH) {
            if (accountId != null || authVersion != null) {
                throw new IllegalArgumentException(
                        "pre-auth sessions must not have account or auth-version metadata");
            }
            return;
        }

        if (accountId == null || authVersion == null) {
            throw new IllegalArgumentException(
                    "authenticated sessions require account and auth-version metadata");
        }
        if (authVersion < 0) {
            throw new IllegalArgumentException("authVersion must be non-negative");
        }
    }

    public UUID getId() {
        return id;
    }

    public SessionKind getKind() {
        return kind;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public String getCsrfTokenHash() {
        return csrfTokenHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastActivityAt() {
        return lastActivityAt;
    }

    public Instant getAbsoluteExpiresAt() {
        return absoluteExpiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public UUID getAccountId() {
        return accountId;
    }

    public Long getAuthVersion() {
        return authVersion;
    }
}
