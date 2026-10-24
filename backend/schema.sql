CREATE TABLE IF NOT EXISTS crops (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  field_name VARCHAR(100) NOT NULL,
  area_acres NUMERIC(10,2) NOT NULL CHECK (area_acres > 0),
  planting_date DATE NOT NULL,
  expected_harvest_date DATE,
  growth_stage VARCHAR(30) NOT NULL DEFAULT 'Seedling'
    CHECK (growth_stage IN ('Seedling','Vegetative','Flowering','Fruiting','Mature')),
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active','Harvested','Cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS irrigation_schedules (
  id BIGSERIAL PRIMARY KEY,
  crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  water_liters NUMERIC(12,2) NOT NULL CHECK (water_liters > 0),
  method VARCHAR(50) NOT NULL DEFAULT 'Drip',
  status VARCHAR(20) NOT NULL DEFAULT 'Scheduled'
    CHECK (status IN ('Scheduled','Completed','Skipped')),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS harvest_records (
  id BIGSERIAL PRIMARY KEY,
  crop_id BIGINT REFERENCES crops(id) ON DELETE SET NULL,
  crop_name VARCHAR(100) NOT NULL,
  harvest_date DATE NOT NULL,
  quantity_kg NUMERIC(12,2) NOT NULL CHECK (quantity_kg >= 0),
  quality VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);
CREATE INDEX IF NOT EXISTS idx_irrigation_date ON irrigation_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_irrigation_crop ON irrigation_schedules(crop_id);
CREATE INDEX IF NOT EXISTS idx_harvest_date ON harvest_records(harvest_date);
