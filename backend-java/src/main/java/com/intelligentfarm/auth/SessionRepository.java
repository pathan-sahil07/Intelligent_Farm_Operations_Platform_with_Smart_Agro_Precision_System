package com.intelligentfarm.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository {

    void save(Session session);

    Optional<Session> findByTokenHash(String tokenHash);

    boolean updateCsrfTokenHash(UUID id, String csrfTokenHash);

    boolean updateLastActivity(UUID id, Instant lastActivityAt);

    boolean revoke(UUID id, Instant revokedAt);
}
