package com.intelligentfarm.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AuthActionTokenRepository {

    void invalidateOpenTokens(UUID accountId, AuthActionType type, Instant consumedAt);

    void save(AuthActionToken token);

    Optional<AuthActionToken> findUsableByHashForUpdate(
            String tokenHash, AuthActionType type, Instant now);

    boolean consume(UUID id, Instant consumedAt);
}
