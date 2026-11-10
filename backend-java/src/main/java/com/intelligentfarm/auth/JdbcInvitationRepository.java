package com.intelligentfarm.auth;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcInvitationRepository implements InvitationRepository {

    private static final String COLUMNS = """
            id, email, full_name, role, status, token_hash, created_by, created_at,
            expires_at, accepted_at, accepted_by, message
            """;

    private static final RowMapper<Invitation> ROW_MAPPER = (resultSet, rowNumber) -> {
        Timestamp acceptedAt = resultSet.getTimestamp("accepted_at");
        return new Invitation(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("email"),
                resultSet.getString("full_name"),
                FarmRole.valueOf(resultSet.getString("role")),
                InvitationStatus.valueOf(resultSet.getString("status")),
                resultSet.getString("token_hash"),
                resultSet.getObject("created_by", UUID.class),
                resultSet.getTimestamp("created_at").toInstant(),
                resultSet.getTimestamp("expires_at").toInstant(),
                acceptedAt == null ? null : acceptedAt.toInstant(),
                resultSet.getObject("accepted_by", UUID.class),
                resultSet.getString("message"));
    };

    private final JdbcTemplate jdbcTemplate;

    public JdbcInvitationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = Objects.requireNonNull(jdbcTemplate, "jdbcTemplate");
    }

    @Override
    public void save(Invitation invitation) {
        Objects.requireNonNull(invitation, "invitation");
        jdbcTemplate.update(
                """
                INSERT INTO invitations (
                    id, email, full_name, role, status, token_hash, created_by, created_at,
                    expires_at, accepted_at, accepted_by, message
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                invitation.id(),
                invitation.email(),
                invitation.fullName(),
                invitation.role().name(),
                invitation.status().name(),
                invitation.tokenHash(),
                invitation.createdBy(),
                Timestamp.from(invitation.createdAt()),
                Timestamp.from(invitation.expiresAt()),
                invitation.acceptedAt() == null ? null : Timestamp.from(invitation.acceptedAt()),
                invitation.acceptedBy(),
                invitation.message());
    }

    @Override
    public Optional<Invitation> findById(UUID id) {
        return jdbcTemplate.query(
                "SELECT " + COLUMNS + " FROM invitations WHERE id = ?",
                ROW_MAPPER,
                id).stream().findFirst();
    }

    @Override
    public Optional<Invitation> findByTokenHash(String tokenHash) {
        return jdbcTemplate.query(
                "SELECT " + COLUMNS + " FROM invitations WHERE token_hash = ?",
                ROW_MAPPER,
                tokenHash).stream().findFirst();
    }

    @Override
    public Optional<Invitation> findByTokenHashForUpdate(String tokenHash) {
        return jdbcTemplate.query(
                "SELECT " + COLUMNS + " FROM invitations WHERE token_hash = ? FOR UPDATE",
                ROW_MAPPER,
                tokenHash).stream().findFirst();
    }

    @Override
    public List<Invitation> findByCreator(UUID creatorId) {
        return jdbcTemplate.query(
                "SELECT " + COLUMNS + " FROM invitations WHERE created_by = ? ORDER BY created_at DESC",
                ROW_MAPPER,
                creatorId);
    }

    @Override
    public boolean replaceTokenAndExpiry(UUID id, String tokenHash, Instant expiresAt) {
        return jdbcTemplate.update(
                """
                UPDATE invitations SET token_hash = ?, expires_at = ?
                WHERE id = ? AND status = 'PENDING'
                """,
                tokenHash,
                Timestamp.from(expiresAt),
                id) == 1;
    }

    @Override
    public boolean expire(UUID id, Instant expiredAt) {
        return jdbcTemplate.update(
                """
                UPDATE invitations SET status = 'EXPIRED'
                WHERE id = ? AND status = 'PENDING' AND expires_at <= ?
                """,
                id,
                Timestamp.from(expiredAt)) == 1;
    }

    @Override
    public boolean accept(UUID id, UUID accountId, Instant acceptedAt) {
        return jdbcTemplate.update(
                """
                UPDATE invitations
                SET status = 'ACCEPTED', accepted_at = ?, accepted_by = ?
                WHERE id = ? AND status = 'PENDING' AND expires_at > ?
                """,
                Timestamp.from(acceptedAt),
                accountId,
                id,
                Timestamp.from(acceptedAt)) == 1;
    }

    @Override
    public boolean revoke(UUID id, Instant revokedAt) {
        return jdbcTemplate.update(
                """
                UPDATE invitations SET status = 'REVOKED'
                WHERE id = ? AND status = 'PENDING' AND expires_at > ?
                """,
                id,
                Timestamp.from(revokedAt)) == 1;
    }
}
