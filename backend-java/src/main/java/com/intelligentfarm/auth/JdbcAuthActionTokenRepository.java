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
public class JdbcAuthActionTokenRepository implements AuthActionTokenRepository {

    private static final String COLUMNS =
            "id, account_id, purpose, token_hash, created_at, expires_at, consumed_at";

    private static final RowMapper<AuthActionToken> ROW_MAPPER = (resultSet, rowNumber) -> {
        Timestamp consumedAt = resultSet.getTimestamp("consumed_at");
        return new AuthActionToken(
                resultSet.getObject("id", UUID.class),
                resultSet.getObject("account_id", UUID.class),
                AuthActionType.valueOf(resultSet.getString("purpose")),
                resultSet.getString("token_hash"),
                resultSet.getTimestamp("created_at").toInstant(),
                resultSet.getTimestamp("expires_at").toInstant(),
                consumedAt == null ? null : consumedAt.toInstant());
    };

    private final JdbcTemplate jdbcTemplate;

    public JdbcAuthActionTokenRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = Objects.requireNonNull(jdbcTemplate, "jdbcTemplate");
    }

    @Override
    public void invalidateOpenTokens(UUID accountId, AuthActionType type, Instant consumedAt) {
        jdbcTemplate.update(
                """
                UPDATE auth_action_tokens SET consumed_at = ?
                WHERE account_id = ? AND purpose = ? AND consumed_at IS NULL
                """,
                Timestamp.from(consumedAt),
                accountId,
                type.name());
    }

    @Override
    public void save(AuthActionToken token) {
        Objects.requireNonNull(token, "token");
        jdbcTemplate.update(
                """
                INSERT INTO auth_action_tokens (
                    id, account_id, purpose, token_hash, created_at, expires_at, consumed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                token.id(),
                token.accountId(),
                token.type().name(),
                token.tokenHash(),
                Timestamp.from(token.createdAt()),
                Timestamp.from(token.expiresAt()),
                token.consumedAt() == null ? null : Timestamp.from(token.consumedAt()));
    }

    @Override
    public Optional<AuthActionToken> findUsableByHashForUpdate(
            String tokenHash, AuthActionType type, Instant now) {
        return jdbcTemplate.query(
                """
                SELECT %s FROM auth_action_tokens
                WHERE token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?
                FOR UPDATE
                """.formatted(COLUMNS),
                ROW_MAPPER,
                tokenHash,
                type.name(),
                Timestamp.from(now)).stream().findFirst();
    }

    @Override
    public boolean consume(UUID id, Instant consumedAt) {
        return jdbcTemplate.update(
                """
                UPDATE auth_action_tokens SET consumed_at = ?
                WHERE id = ? AND consumed_at IS NULL
                """,
                Timestamp.from(consumedAt),
                id) == 1;
    }
}
