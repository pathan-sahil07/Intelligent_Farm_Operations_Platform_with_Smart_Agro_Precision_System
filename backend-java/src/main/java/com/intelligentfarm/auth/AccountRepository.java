package com.intelligentfarm.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository {

    Optional<Account> findById(UUID id);

    /**
     * The supplied email must be normalized with {@link Account#normalizeEmail(String)}.
     */
    Optional<Account> findByEmail(String normalizedEmail);

    /** Insert a new account; the unique email constraint arbitrates concurrent registrations. */
    boolean createIfAbsent(Account account);

    /**
     * Atomically replace the password hash, increment auth_version, and set updated_at.
     * Returns false when no account has the given ID.
     */
    boolean updatePasswordHashAndIncrementAuthVersion(
            UUID id, String passwordHash, Instant updatedAt);

    /**
     * Atomically increment auth_version and set updated_at. Returns false when no account has
     * the given ID.
     */
    boolean incrementAuthVersion(UUID id, Instant updatedAt);
}
