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
    private final String fullName;
    private final String mobileNumber;
    private final FarmRole role;
    private final AccountStatus status;
    private final Instant emailVerifiedAt;
    private final Instant createdAt;
    private final Instant updatedAt;

    public Account(
            UUID id,
            String email,
            String passwordHash,
            long authVersion,
            String fullName,
            String mobileNumber,
            FarmRole role,
            AccountStatus status,
            Instant emailVerifiedAt,
            Instant createdAt,
            Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "id");
        this.email = normalizeEmail(email);
        this.passwordHash = requirePasswordHash(passwordHash);
        if (authVersion < 0) {
            throw new IllegalArgumentException("authVersion must be non-negative");
        }
        this.authVersion = authVersion;
        this.fullName = normalizeOptional(fullName, 255, "fullName");
        this.mobileNumber = normalizeOptional(mobileNumber, 64, "mobileNumber");
        this.role = role;
        this.status = Objects.requireNonNull(status, "status");
        this.emailVerifiedAt = emailVerifiedAt;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt");
        if (status == AccountStatus.ACTIVE && (role == null || emailVerifiedAt == null)) {
            throw new IllegalArgumentException("active accounts require a role and verified email");
        }
    }

    public static Account createPendingOwner(
            String email, String passwordHash, String fullName, String mobileNumber, Instant now) {
        return new Account(
                UUID.randomUUID(),
                email,
                passwordHash,
                0,
                fullName,
                mobileNumber,
                FarmRole.FARM_OWNER,
                AccountStatus.PENDING_VERIFICATION,
                null,
                now,
                now);
    }

    public static Account createVerifiedMember(
            String email,
            String passwordHash,
            String fullName,
            String mobileNumber,
            FarmRole role,
            Instant now) {
        return new Account(
                UUID.randomUUID(),
                email,
                passwordHash,
                0,
                fullName,
                mobileNumber,
                Objects.requireNonNull(role, "role"),
                AccountStatus.ACTIVE,
                now,
                now,
                now);
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

    private static String normalizeOptional(String value, int maxLength, String name) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(name + " is too long");
        }
        return normalized;
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

    public String getFullName() {
        return fullName;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public FarmRole getRole() {
        return role;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public Instant getEmailVerifiedAt() {
        return emailVerifiedAt;
    }

    public boolean isEmailVerified() {
        return emailVerifiedAt != null || status == AccountStatus.ACTIVE;
    }

    public boolean isEligibleForAuthentication() {
        return status == AccountStatus.ACTIVE && role != null && emailVerifiedAt != null;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
