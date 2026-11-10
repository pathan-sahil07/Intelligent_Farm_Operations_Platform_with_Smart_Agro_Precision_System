package com.intelligentfarm.auth;

import java.sql.Timestamp;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class JdbcAccountRepository implements AccountRepository {

    private static final String ACCOUNT_SELECT =
            """
            SELECT a.id, a.email, a.password_hash, a.auth_version,
                   up.full_name, up.mobile_number, up.role,
                   COALESCE(up.status, CASE WHEN a.email_verified THEN 'ACTIVE' ELSE 'PENDING_VERIFICATION' END) AS account_status,
                   CASE WHEN a.email_verified THEN a.updated_at ELSE NULL END AS email_verified_at,
                   a.created_at, a.updated_at
            FROM accounts a
            LEFT JOIN user_profiles up ON a.id = up.id
            """;

    private static final RowMapper<Account> ACCOUNT_ROW_MAPPER = (resultSet, rowNumber) -> {
        java.sql.Timestamp verifiedAt = resultSet.getTimestamp("email_verified_at");
        String role = resultSet.getString("role");
        return new Account(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("email"),
                resultSet.getString("password_hash"),
                resultSet.getLong("auth_version"),
                resultSet.getString("full_name"),
                resultSet.getString("mobile_number"),
                role == null ? null : FarmRole.valueOf(role),
                AccountStatus.valueOf(resultSet.getString("account_status")),
                verifiedAt == null ? null : verifiedAt.toInstant(),
                resultSet.getTimestamp("created_at").toInstant(),
                resultSet.getTimestamp("updated_at").toInstant());
    };

    private final JdbcTemplate jdbcTemplate;

    public JdbcAccountRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = Objects.requireNonNull(jdbcTemplate, "jdbcTemplate");
    }

    @Override
    public Optional<Account> findById(UUID id) {
        Objects.requireNonNull(id, "id");
        return jdbcTemplate.query(
                ACCOUNT_SELECT + " WHERE a.id = ?",
                ACCOUNT_ROW_MAPPER,
                id).stream().findFirst();
    }

    @Override
    public Optional<Account> findByEmail(String normalizedEmail) {
        String email = Account.normalizeEmail(normalizedEmail);
        return jdbcTemplate.query(
                ACCOUNT_SELECT + " WHERE a.email = ?",
                ACCOUNT_ROW_MAPPER,
                email).stream().findFirst();
    }

    @Transactional
    @Override
    public boolean createIfAbsent(Account account) {
        Objects.requireNonNull(account, "account");
        boolean inserted = jdbcTemplate.update(
                """
                INSERT INTO accounts (
                    id, email, password_hash, auth_version, email_verified, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (email) DO NOTHING
                """,
                account.getId(),
                account.getEmail(),
                account.getPasswordHash(),
                account.getAuthVersion(),
                account.isEmailVerified(),
                Timestamp.from(account.getCreatedAt()),
                Timestamp.from(account.getUpdatedAt())) == 1;

        if (inserted) {
            String roleName = account.getRole() == null ? "FARM_OWNER" : account.getRole().name();
            String status = account.getStatus() == null ? "ACTIVE" : account.getStatus().name();
            jdbcTemplate.update(
                    """
                    INSERT INTO user_profiles (
                        id, full_name, mobile_number, role, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (id) DO UPDATE SET
                        full_name = EXCLUDED.full_name,
                        mobile_number = EXCLUDED.mobile_number,
                        role = EXCLUDED.role,
                        status = EXCLUDED.status,
                        updated_at = EXCLUDED.updated_at
                    """,
                    account.getId(),
                    account.getFullName(),
                    account.getMobileNumber(),
                    roleName,
                    status,
                    Timestamp.from(account.getCreatedAt()),
                    Timestamp.from(account.getUpdatedAt()));
        }
        return inserted;
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

    @Transactional
    @Override
    public boolean markEmailVerified(UUID id, java.time.Instant verifiedAt) {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(verifiedAt, "verifiedAt");
        int updated = jdbcTemplate.update(
                """
                UPDATE accounts
                SET email_verified = TRUE, updated_at = ?
                WHERE id = ?
                """,
                Timestamp.from(verifiedAt),
                id);
        jdbcTemplate.update(
                """
                UPDATE user_profiles
                SET status = 'ACTIVE', updated_at = ?
                WHERE id = ?
                """,
                Timestamp.from(verifiedAt),
                id);
        return updated == 1;
    }

    @Transactional
    @Override
    public boolean assignRoleAndActivateIfUnassigned(
            UUID id, FarmRole role, String fullName, String mobileNumber, java.time.Instant verifiedAt) {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(role, "role");
        Objects.requireNonNull(verifiedAt, "verifiedAt");
        jdbcTemplate.update(
                """
                UPDATE accounts
                SET email_verified = TRUE, auth_version = auth_version + 1, updated_at = ?
                WHERE id = ?
                """,
                Timestamp.from(verifiedAt),
                id);
        return jdbcTemplate.update(
                """
                INSERT INTO user_profiles (id, full_name, mobile_number, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
                ON CONFLICT (id) DO UPDATE
                SET role = EXCLUDED.role,
                    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
                    mobile_number = COALESCE(EXCLUDED.mobile_number, user_profiles.mobile_number),
                    status = 'ACTIVE',
                    updated_at = EXCLUDED.updated_at
                """,
                id,
                fullName,
                mobileNumber,
                role.name(),
                Timestamp.from(verifiedAt),
                Timestamp.from(verifiedAt)) >= 1;
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
