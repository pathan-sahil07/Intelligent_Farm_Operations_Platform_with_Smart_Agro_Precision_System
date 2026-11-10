package com.intelligentfarm.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthActionTokenService {

    private final AuthActionTokenRepository repository;
    private final SessionTokenService tokenService;
    private final Clock clock;

    public AuthActionTokenService(
            AuthActionTokenRepository repository, SessionTokenService tokenService, Clock clock) {
        this.repository = Objects.requireNonNull(repository, "repository");
        this.tokenService = Objects.requireNonNull(tokenService, "tokenService");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Transactional
    public String issue(UUID accountId, AuthActionType type, Duration lifetime) {
        Objects.requireNonNull(accountId, "accountId");
        Objects.requireNonNull(type, "type");
        if (lifetime == null || lifetime.isNegative() || lifetime.isZero()) {
            throw new IllegalArgumentException("lifetime must be positive");
        }

        Instant now = Instant.now(clock);
        String rawToken = tokenService.generateToken();
        repository.invalidateOpenTokens(accountId, type, now);
        repository.save(new AuthActionToken(
                UUID.randomUUID(),
                accountId,
                type,
                tokenService.hashToken(rawToken),
                now,
                now.plus(lifetime),
                null));
        return rawToken;
    }

    @Transactional
    public Optional<AuthActionToken> consume(String rawToken, AuthActionType type) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }
        Instant now = Instant.now(clock);
        Optional<AuthActionToken> token = repository.findUsableByHashForUpdate(
                tokenService.hashToken(rawToken), type, now);
        if (token.isEmpty() || !token.get().isUsableAt(now)
                || !repository.consume(token.get().id(), now)) {
            return Optional.empty();
        }
        return token;
    }
}
