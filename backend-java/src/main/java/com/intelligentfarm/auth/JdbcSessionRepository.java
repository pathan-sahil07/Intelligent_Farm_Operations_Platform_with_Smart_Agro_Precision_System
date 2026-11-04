package com.intelligentfarm.auth;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcSessionRepository implements SessionRepository {

    private static final String SESSION_COLUMNS = """
            id, kind, token_hash, csrf_token_hash, created_at, last_activity_at,
            absolute_expires_at, revoked_at, account_id, auth_version
            """;

    private static final RowMapper<Session> SESSION_ROW_MAPPER = (resultSet, rowNumber) -> {
        Timestamp revokedAt = resultSet.getTimestamp("revoked_at");
        UUID accountId = resultSet.getObject("account_id", UUID.class);
        long authVersionValue = resultSet.getLong("auth_version");
        Long authVersion = resultSet.wasNull() ? null : authVersionValue;
        return new Session(
                resultSet.getObject("id", UUID.class),
                SessionKind.valueOf(resultSet.getString("kind")),
                resultSet.getString("token_hash"),
                resultSet.getString("csrf_token_hash"),
                resultSet.getTimestamp("created_at").toInstant(),
                resultSet.getTimestamp("last_activity_at").toInstant(),
                resultSet.getTimestamp("absolute_expires_at").toInstant(),
                revokedAt == null ? null : revokedAt.toInstant(),
                accountId,
                authVersion);
    };

    private final JdbcTemplate jdbcTemplate;

    public JdbcSessionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = Objects.requireNonNull(jdbcTemplate, "jdbcTemplate");
    }

    @Override
    public void save(Session session) {
        Objects.requireNonNull(session, "session");
        jdbcTemplate.update(
                """
                INSERT INTO sessions (
                    id, kind, token_hash, csrf_token_hash, created_at, last_activity_at,
                    absolute_expires_at, revoked_at, account_id, auth_version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                session.getId(),
                session.getKind().name(),
                session.getTokenHash(),
                session.getCsrfTokenHash(),
                Timestamp.from(session.getCreatedAt()),
                Timestamp.from(session.getLastActivityAt()),
                Timestamp.from(session.getAbsoluteExpiresAt()),
                session.getRevokedAt() == null ? null : Timestamp.from(session.getRevokedAt()),
                session.getAccountId(),
                session.getAuthVersion());
    }

    @Override
    public Optional<Session> findByTokenHash(String tokenHash) {
        Objects.requireNonNull(tokenHash, "tokenHash");
        return jdbcTemplate.query(
                "SELECT " + SESSION_COLUMNS + " FROM sessions WHERE token_hash = ?",
                SESSION_ROW_MAPPER,
                tokenHash).stream().findFirst();
    }

    @Override
    public boolean updateCsrfTokenHash(UUID id, String csrfTokenHash) {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(csrfTokenHash, "csrfTokenHash");
        return jdbcTemplate.update(
                "UPDATE sessions SET csrf_token_hash = ? WHERE id = ? AND revoked_at IS NULL",
                csrfTokenHash,
                id) == 1;
    }

    @Override
    public boolean updateLastActivity(UUID id, Instant lastActivityAt) {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(lastActivityAt, "lastActivityAt");
        return jdbcTemplate.update(
                "UPDATE sessions SET last_activity_at = ? WHERE id = ? AND revoked_at IS NULL",
                Timestamp.from(lastActivityAt),
                id) == 1;
    }

    @Override
    public boolean revoke(UUID id, Instant revokedAt) {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(revokedAt, "revokedAt");
        return jdbcTemplate.update(
                "UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
                Timestamp.from(revokedAt),
                id) == 1;
    }
}
