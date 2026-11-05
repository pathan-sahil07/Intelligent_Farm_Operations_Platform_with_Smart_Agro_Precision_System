CREATE TABLE IF NOT EXISTS farms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    owner_id BIGINT NOT NULL,
    village VARCHAR(150),
    district VARCHAR(150),
    state VARCHAR(150),
    latitude NUMERIC(9,6) CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180),
    total_area_acres NUMERIC(10,2) NOT NULL CHECK (total_area_acres > 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plots (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    area_acres NUMERIC(10,2) NOT NULL CHECK (area_acres > 0),
    soil_type VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS farm_worker (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_farm_worker UNIQUE (farm_id, user_id)
);

CREATE TABLE IF NOT EXISTS soil_tests (
    id BIGSERIAL PRIMARY KEY,
    plot_id BIGINT NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    ph NUMERIC(3,1) CHECK (ph BETWEEN 0 AND 14),
    nitrogen NUMERIC(6,2) CHECK (nitrogen >= 0),
    phosphorus NUMERIC(6,2) CHECK (phosphorus >= 0),
    potassium NUMERIC(6,2) CHECK (potassium >= 0),
    notes VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS land_document (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    doc_type VARCHAR(100),
    file_name VARCHAR(255),
    file_path VARCHAR(1000),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_plots_farm ON plots(farm_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_plot ON soil_tests(plot_id);
CREATE INDEX IF NOT EXISTS idx_documents_farm ON land_document(farm_id);
