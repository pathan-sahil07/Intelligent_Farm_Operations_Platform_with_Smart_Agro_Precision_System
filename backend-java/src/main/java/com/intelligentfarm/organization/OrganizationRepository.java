package com.intelligentfarm.organization;

import java.sql.Timestamp;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class OrganizationRepository {

    private static final RowMapper<OrganizationResponse> ROW_MAPPER =
            (rs, rowNum) -> new OrganizationResponse(
                    rs.getObject("id", UUID.class),
                    rs.getString("name"),
                    rs.getString("email"),
                    rs.getString("contact"),
                    rs.getString("address"),
                    rs.getString("description"),
                    rs.getObject("created_by", UUID.class),
                    rs.getTimestamp("created_at").toInstant().toString(),
                    rs.getLong("farm_count"),
                    rs.getLong("user_count")
            );

    private final JdbcTemplate jdbcTemplate;

    public OrganizationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = Objects.requireNonNull(jdbcTemplate);
    }

    public Optional<OrganizationResponse> findCurrentByAccountId(UUID accountId) {
        Objects.requireNonNull(accountId, "accountId");

        return jdbcTemplate.query(
                """
                SELECT
                    o.id,
                    o.name,
                    o.email,
                    o.contact,
                    o.address,
                    o.description,
                    o.created_by,
                    o.created_at,
                    (
                        SELECT COUNT(*)
                        FROM farms f
                        WHERE f.organization_id = o.id
                    ) AS farm_count,
                    (
                        SELECT COUNT(*)
                        FROM user_profiles up2
                        WHERE up2.organization_id = o.id
                    ) AS user_count
                FROM user_profiles up
                JOIN organizations o
                    ON o.id = up.organization_id
                WHERE up.id = ?
                """,
                ROW_MAPPER,
                accountId
        ).stream().findFirst();
    }
}
