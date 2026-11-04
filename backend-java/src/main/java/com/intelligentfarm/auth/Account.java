package com.intelligentfarm.auth;

import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

public final class Account {

    private final UUID id;
    private final String email;
    private final String passwordHash;
    private final long authVersion;
    private final Instant createdAt;
    private final Instant updatedAt;

    public Account(
            UUID id,
            String email,
            String passwordHash,
            long authVersion,
            Instant createdAt,
            Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "id");
        this.email = normalizeEmail(email);
        this.passwordHash = requirePasswordHash(passwordHash);
        if (authVersion < 0) {
            throw new IllegalArgumentException("authVersion must be non-negative");
        }
        this.authVersion = authVersion;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt");
    }

    public static Account create(String email, String passwordHash, Instant now) {
        return new Account(UUID.randomUUID(), email, passwordHash, 0, now, now);
    }

    public static String normalizeEmail(String email) {
        String normalizedEmail = Objects.requireNonNull(email, "email")
                .trim()
                .toLowerCase(Locale.ROOT);
        if (normalizedEmail.isEmpty() || normalizedEmail.length() > 254) {
            throw new IllegalArgumentException("email must contain between 1 and 254 characters");
        }
        return normalizedEmail;
    }

    private static String requirePasswordHash(String passwordHash) {
        Objects.requireNonNull(passwordHash, "passwordHash");
        if (passwordHash.isBlank() || passwordHash.length() > 255) {
            throw new IllegalArgumentException(
                    "passwordHash must contain between 1 and 255 characters");
        }
        return passwordHash;
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public long getAuthVersion() {
        return authVersion;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
