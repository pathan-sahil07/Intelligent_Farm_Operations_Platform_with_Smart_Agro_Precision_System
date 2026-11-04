package com.intelligentfarm.auth;

import java.sql.Timestamp;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAccountRepository implements AccountRepository {

    private static final String ACCOUNT_COLUMNS =
            "id, email, password_hash, auth_version, created_at, updated_at";

    private static final RowMapper<Account> ACCOUNT_ROW_MAPPER = (resultSet, rowNumber) ->
            new Account(
                    resultSet.getObject("id", UUID.class),
                    resultSet.getString("email"),
                    resultSet.getString("password_hash"),
                    resultSet.getLong("auth_version"),
                    resultSet.getTimestamp("created_at").toInstant(),
                    resultSet.getTimestamp("updated_at").toInstant());

    private final JdbcTemplate jdbcTemplate;

    public JdbcAccountRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = Objects.requireNonNull(jdbcTemplate, "jdbcTemplate");
    }

    @Override
    public Optional<Account> findById(UUID id) {
        Objects.requireNonNull(id, "id");
        return jdbcTemplate.query(
                "SELECT " + ACCOUNT_COLUMNS + " FROM accounts WHERE id = ?",
                ACCOUNT_ROW_MAPPER,
                id).stream().findFirst();
    }

    @Override
    public Optional<Account> findByEmail(String normalizedEmail) {
        String email = Account.normalizeEmail(normalizedEmail);
        return jdbcTemplate.query(
                "SELECT " + ACCOUNT_COLUMNS + " FROM accounts WHERE email = ?",
                ACCOUNT_ROW_MAPPER,
                email).stream().findFirst();
    }

    @Override
    public boolean createIfAbsent(Account account) {
        Objects.requireNonNull(account, "account");
        return jdbcTemplate.update(
                """
                INSERT INTO accounts (
                    id, email, password_hash, auth_version, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (email) DO NOTHING
                """,
                account.getId(),
                account.getEmail(),
                account.getPasswordHash(),
                account.getAuthVersion(),
                Timestamp.from(account.getCreatedAt()),
                Timestamp.from(account.getUpdatedAt())) == 1;
    }

    @Override
    public boolean updatePasswordHashAndIncrementAuthVersion(
            UUID id, String passwordHash, java.time.Instant updatedAt) {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(passwordHash, "passwordHash");
        Objects.requireNonNull(updatedAt, "updatedAt");
        return jdbcTemplate.update(
                """
                UPDATE accounts
                SET password_hash = ?, auth_version = auth_version + 1, updated_at = ?
                WHERE id = ?
                """,
                passwordHash,
                Timestamp.from(updatedAt),
                id) == 1;
    }

    @Override
    public boolean incrementAuthVersion(UUID id, java.time.Instant updatedAt) {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(updatedAt, "updatedAt");
        return jdbcTemplate.update(
                """
                UPDATE accounts
                SET auth_version = auth_version + 1, updated_at = ?
                WHERE id = ?
                """,
                Timestamp.from(updatedAt),
                id) == 1;
    }
}
