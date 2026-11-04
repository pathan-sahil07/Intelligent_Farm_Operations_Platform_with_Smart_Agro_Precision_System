package com.intelligentfarm.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public final class PasswordResetService {

    private final AccountRepository accountRepository;
    private final Clock clock;

    public PasswordResetService(AccountRepository accountRepository, Clock clock) {
        this.accountRepository = Objects.requireNonNull(accountRepository, "accountRepository");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    /**
     * Accepts an already-encoded password hash. No reset-token flow or transaction is provided.
     */
    public boolean resetPassword(UUID accountId, String encodedPasswordHash) {
        Objects.requireNonNull(accountId, "accountId");
        Objects.requireNonNull(encodedPasswordHash, "encodedPasswordHash");
        if (encodedPasswordHash.isBlank()) {
            throw new IllegalArgumentException("encodedPasswordHash must not be blank");
        }
        Instant updatedAt = Instant.now(clock);
        return accountRepository.updatePasswordHashAndIncrementAuthVersion(
                accountId, encodedPasswordHash, updatedAt);
    }
}
