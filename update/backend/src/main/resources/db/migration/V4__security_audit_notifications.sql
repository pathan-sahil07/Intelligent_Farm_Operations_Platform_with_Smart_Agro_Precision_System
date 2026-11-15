-- V4: users, RBAC, audit log, notifications.
-- NOTE: farms.owner_id / farm_worker.user_id intentionally get NO foreign key to users:
-- rows created before authentication existed may reference arbitrary ids, and an FK would fail this migration.

CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(40) PRIMARY KEY,
    description VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS permissions (
    code VARCHAR(60) PRIMARY KEY,
    description VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role VARCHAR(40) NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
    permission VARCHAR(60) NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
    PRIMARY KEY (role, permission)
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    phone VARCHAR(40),
    role VARCHAR(40) NOT NULL REFERENCES roles(name),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_email_lower CHECK (email = lower(email))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    user_email VARCHAR(190),
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id BIGINT,
    details VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1000),
    link VARCHAR(300),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    dedupe_key VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notification_dedupe UNIQUE (user_id, dedupe_key)
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ------------------------------------------------------------------ seed roles
INSERT INTO roles(name, description) VALUES
 ('ADMIN','Full platform administrator'),
 ('FARM_OWNER','Owns and manages farms'),
 ('FARM_MANAGER','Manages day-to-day farm operations'),
 ('AGRONOMIST','Crop and irrigation specialist'),
 ('FIELD_WORKER','Carries out assigned field work')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------ seed permissions
INSERT INTO permissions(code, description) VALUES
 ('FARM_READ','View farms, plots and documents'),
 ('FARM_WRITE','Create and edit farms, plots and documents'),
 ('FARM_DELETE','Delete farms'),
 ('FARM_ASSIGN','Assign users to farms'),
 ('CROP_READ','View crops and harvests'),
 ('CROP_WRITE','Manage crops, health and activity records'),
 ('IRRIGATION_READ','View irrigation'),
 ('IRRIGATION_WRITE','Create and edit irrigation schedules'),
 ('IRRIGATION_UPDATE','Update irrigation status'),
 ('INVENTORY_READ','View inventory'),
 ('INVENTORY_WRITE','Manage inventory and suppliers'),
 ('EQUIPMENT_READ','View equipment'),
 ('EQUIPMENT_WRITE','Manage equipment and maintenance'),
 ('RESOURCE_READ','View resources and labour'),
 ('RESOURCE_WRITE','Manage resources and labour'),
 ('TASK_READ','View tasks'),
 ('TASK_WRITE','Create and edit tasks'),
 ('TASK_UPDATE','Update status of assigned tasks'),
 ('WEATHER_READ','View weather'),
 ('GIS_READ','View maps'),
 ('GIS_WRITE','Edit plot boundaries'),
 ('ANALYTICS_READ','View analytics and reports'),
 ('USER_MANAGE','Manage users'),
 ('ROLE_MANAGE','Manage roles and permissions'),
 ('AUDIT_READ','View audit log')
ON CONFLICT DO NOTHING;

-- ADMIN: everything
INSERT INTO role_permissions(role, permission) SELECT 'ADMIN', code FROM permissions ON CONFLICT DO NOTHING;
-- FARM_OWNER: everything except platform administration
INSERT INTO role_permissions(role, permission) SELECT 'FARM_OWNER', code FROM permissions
 WHERE code NOT IN ('USER_MANAGE','ROLE_MANAGE','AUDIT_READ') ON CONFLICT DO NOTHING;
-- FARM_MANAGER: as owner but cannot delete farms
INSERT INTO role_permissions(role, permission) SELECT 'FARM_MANAGER', code FROM permissions
 WHERE code NOT IN ('USER_MANAGE','ROLE_MANAGE','AUDIT_READ','FARM_DELETE') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role, permission) SELECT 'AGRONOMIST', code FROM permissions
 WHERE code IN ('FARM_READ','CROP_READ','CROP_WRITE','IRRIGATION_READ','IRRIGATION_WRITE','IRRIGATION_UPDATE',
                'INVENTORY_READ','WEATHER_READ','GIS_READ','ANALYTICS_READ','TASK_READ') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role, permission) SELECT 'FIELD_WORKER', code FROM permissions
 WHERE code IN ('FARM_READ','CROP_READ','IRRIGATION_READ','IRRIGATION_UPDATE','INVENTORY_READ','EQUIPMENT_READ',
                'WEATHER_READ','GIS_READ','TASK_READ','TASK_UPDATE') ON CONFLICT DO NOTHING;
