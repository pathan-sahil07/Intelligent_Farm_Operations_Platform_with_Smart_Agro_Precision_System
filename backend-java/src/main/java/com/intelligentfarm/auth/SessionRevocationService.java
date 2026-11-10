package com.intelligentfarm.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class SessionRevocationService {

    private final AccountRepository accountRepository;
    private final Clock clock;

    public SessionRevocationService(AccountRepository accountRepository, Clock clock) {
        this.accountRepository = Objects.requireNonNull(accountRepository, "accountRepository");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    /**
     * Advances auth_version so future session validation can reject sessions carrying an
     * older version. This foundation does not delete persisted sessions or enforce validation.
     */
    public boolean revokeAllSessions(UUID accountId) {
        Objects.requireNonNull(accountId, "accountId");
        return accountRepository.incrementAuthVersion(accountId, Instant.now(clock));
    }
}
