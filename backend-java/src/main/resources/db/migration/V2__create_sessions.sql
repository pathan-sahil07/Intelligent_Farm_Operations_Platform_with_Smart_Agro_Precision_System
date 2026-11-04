CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    kind VARCHAR(32) NOT NULL CHECK (kind IN ('PRE_AUTH', 'AUTHENTICATED')),
    token_hash VARCHAR(43) NOT NULL UNIQUE,
    csrf_token_hash VARCHAR(43) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL,
    absolute_expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    auth_version BIGINT,
    CONSTRAINT sessions_time_check CHECK (
        absolute_expires_at > created_at
        AND last_activity_at >= created_at
        AND last_activity_at <= absolute_expires_at
        AND (revoked_at IS NULL OR revoked_at >= created_at)
    ),
    CONSTRAINT sessions_identity_check CHECK (
        (kind = 'PRE_AUTH' AND account_id IS NULL AND auth_version IS NULL)
        OR (kind = 'AUTHENTICATED' AND account_id IS NOT NULL AND auth_version IS NOT NULL AND auth_version >= 0)
    )
);

CREATE INDEX sessions_account_id_idx ON sessions(account_id);
CREATE INDEX sessions_absolute_expires_at_idx ON sessions(absolute_expires_at);
