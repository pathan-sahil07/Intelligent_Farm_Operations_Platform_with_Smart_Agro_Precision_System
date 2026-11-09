-- V5: module extensions (crops, irrigation, tasks, labour, inventory, equipment).
-- Idempotent: only ALTER ... IF NOT EXISTS / CREATE ... IF NOT EXISTS. V1-V3 are never edited.
-- Legacy rows created before farm scoping keep farm_id = NULL; the API shows them to ADMIN only.

-- ---------------------------------------------------------------- crops / irrigation / harvests
ALTER TABLE crops ADD COLUMN IF NOT EXISTS farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE;
ALTER TABLE crops ADD COLUMN IF NOT EXISTS plot_id BIGINT REFERENCES plots(id) ON DELETE SET NULL;
ALTER TABLE irrigation_schedules ADD COLUMN IF NOT EXISTS farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE;
ALTER TABLE irrigation_schedules ADD COLUMN IF NOT EXISTS plot_id BIGINT REFERENCES plots(id) ON DELETE SET NULL;
ALTER TABLE harvest_records ADD COLUMN IF NOT EXISTS farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_crops_farm ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_plot ON crops(plot_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm_status ON crops(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_irrigation_farm ON irrigation_schedules(farm_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_plot_date ON irrigation_schedules(plot_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_irrigation_crop_date ON irrigation_schedules(crop_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_harvest_farm ON harvest_records(farm_id);

-- ---------------------------------------------------------------- suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(40),
    email VARCHAR(150),
    address VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_farm ON suppliers(farm_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_farm_name ON suppliers(farm_id, lower(name));

-- ---------------------------------------------------------------- tasks
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    task_type VARCHAR(50),
    assigned_to BIGINT,
    plot_id BIGINT REFERENCES plots(id) ON DELETE SET NULL,
    crop_id BIGINT REFERENCES crops(id) ON DELETE SET NULL,
    equipment_id BIGINT REFERENCES equipment(id) ON DELETE SET NULL,
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','DONE','CANCELLED')),
    estimated_cost NUMERIC(14,2) CHECK (estimated_cost >= 0),
    actual_cost NUMERIC(14,2) CHECK (actual_cost >= 0),
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_farm_status ON tasks(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);

-- ---------------------------------------------------------------- labour
CREATE TABLE IF NOT EXISTS labour_records (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    work_date DATE NOT NULL,
    hours NUMERIC(6,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    hourly_rate NUMERIC(10,2) NOT NULL CHECK (hourly_rate >= 0),
    task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_labour_farm_date ON labour_records(farm_id, work_date);
CREATE INDEX IF NOT EXISTS idx_labour_user ON labour_records(user_id);

-- ---------------------------------------------------------------- crop health / activities / soil moisture
CREATE TABLE IF NOT EXISTS crop_health_records (
    id BIGSERIAL PRIMARY KEY,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('HEALTHY','STRESSED','DISEASED','PEST')),
    issue VARCHAR(300),
    notes VARCHAR(1000),
    recorded_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crop_health_crop ON crop_health_records(crop_id, record_date);

CREATE TABLE IF NOT EXISTS crop_activities (
    id BIGSERIAL PRIMARY KEY,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('FERTILIZER','PESTICIDE','OTHER')),
    activity_date DATE NOT NULL,
    product_name VARCHAR(150),
    inventory_item_id BIGINT REFERENCES inventory_items(id) ON DELETE SET NULL,
    quantity NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit VARCHAR(30),
    notes VARCHAR(1000),
    recorded_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crop_activities_crop ON crop_activities(crop_id, activity_date);

CREATE TABLE IF NOT EXISTS soil_moisture_readings (
    id BIGSERIAL PRIMARY KEY,
    plot_id BIGINT NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    moisture_percent NUMERIC(5,2) NOT NULL CHECK (moisture_percent >= 0 AND moisture_percent <= 100),
    source VARCHAR(50),
    recorded_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_soil_moisture_plot ON soil_moisture_readings(plot_id, reading_date);

-- ---------------------------------------------------------------- inventory
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(14,2) CHECK (unit_cost >= 0);
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS crop_id BIGINT REFERENCES crops(id) ON DELETE SET NULL;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS created_by BIGINT;

CREATE INDEX IF NOT EXISTS idx_inventory_items_farm ON inventory_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier ON inventory_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_item ON inventory_transactions(inventory_item_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_type ON inventory_transactions(transaction_type, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_crop ON inventory_transactions(crop_id);

-- ---------------------------------------------------------------- equipment
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS operating_hours NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (operating_hours >= 0);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS allocated_to_user_id BIGINT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS allocated_to_task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;

CREATE INDEX IF NOT EXISTS idx_equipment_farm_status ON equipment(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_due ON equipment_maintenance(scheduled_date) WHERE completed_date IS NULL;

CREATE TABLE IF NOT EXISTS equipment_usage (
    id BIGSERIAL PRIMARY KEY,
    equipment_id BIGINT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    hours NUMERIC(6,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    notes VARCHAR(500),
    recorded_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_equipment ON equipment_usage(equipment_id, usage_date);

-- ---------------------------------------------------------------- constraints on pre-existing free-text columns
-- NOT VALID: enforced for new/updated rows, legacy rows are not re-checked. Guarded for idempotency.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_equipment_status') THEN
        ALTER TABLE equipment ADD CONSTRAINT chk_equipment_status
            CHECK (status IN ('AVAILABLE','IN_USE','MAINTENANCE','RETIRED')) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_equipment_maintenance_type') THEN
        ALTER TABLE equipment_maintenance ADD CONSTRAINT chk_equipment_maintenance_type
            CHECK (maintenance_type IN ('SERVICE','REPAIR','INSPECTION')) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_category') THEN
        ALTER TABLE inventory_items ADD CONSTRAINT chk_inventory_category
            CHECK (category IN ('SEED','FERTILIZER','PESTICIDE','CONSUMABLE','OTHER')) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_irrigation_status') THEN
        ALTER TABLE irrigation_schedules ADD CONSTRAINT chk_irrigation_status
            CHECK (status IN ('Scheduled','Completed','Skipped')) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_crops_status') THEN
        ALTER TABLE crops ADD CONSTRAINT chk_crops_status
            CHECK (status IN ('Active','Harvested')) NOT VALID;
    END IF;
END
$$;
