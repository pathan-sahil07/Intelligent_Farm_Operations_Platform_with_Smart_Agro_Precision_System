CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE farms ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);
ALTER TABLE plots ADD COLUMN IF NOT EXISTS boundary geometry(Polygon, 4326);

CREATE INDEX IF NOT EXISTS idx_farms_location ON farms USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_plots_boundary ON plots USING GIST (boundary);

CREATE TABLE IF NOT EXISTS inventory_items (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    quantity NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    unit_cost NUMERIC(14,2) CHECK (unit_cost >= 0),
    expiry_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    inventory_item_id BIGINT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('PURCHASE','CONSUMPTION','TRANSFER')),
    quantity NUMERIC(14,2) NOT NULL CHECK (quantity > 0),
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    identifier VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    purchase_date DATE,
    purchase_cost NUMERIC(14,2) CHECK (purchase_cost >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_maintenance (
    id BIGSERIAL PRIMARY KEY,
    equipment_id BIGINT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    maintenance_type VARCHAR(100) NOT NULL,
    cost NUMERIC(14,2) CHECK (cost >= 0),
    notes VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS resources (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    planned_quantity NUMERIC(14,2) NOT NULL CHECK (planned_quantity >= 0),
    consumed_quantity NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (consumed_quantity >= 0),
    cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    season VARCHAR(80)
);
