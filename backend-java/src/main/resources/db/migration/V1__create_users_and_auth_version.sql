-- Proposed schema artifact only; no migration runner is configured in this phase.
CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    auth_version BIGINT NOT NULL DEFAULT 0 CHECK (auth_version >= 0),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
