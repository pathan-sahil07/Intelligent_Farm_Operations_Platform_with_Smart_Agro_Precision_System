package com.intelligentfarm.auth;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvitationRepository {

    void save(Invitation invitation);

    Optional<Invitation> findById(UUID id);

    Optional<Invitation> findByTokenHash(String tokenHash);

    Optional<Invitation> findByTokenHashForUpdate(String tokenHash);

    List<Invitation> findByCreator(UUID creatorId);

    boolean replaceTokenAndExpiry(UUID id, String tokenHash, Instant expiresAt);

    boolean expire(UUID id, Instant expiredAt);

    boolean accept(UUID id, UUID accountId, Instant acceptedAt);

    boolean revoke(UUID id, Instant revokedAt);
}
