-- Keep farms.location (PostGIS point) in sync with the latitude/longitude columns edited by the API.
CREATE OR REPLACE FUNCTION sync_farm_location() RETURNS trigger AS $$
BEGIN
    IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
        NEW.location := NULL;
    ELSE
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude::float8, NEW.latitude::float8), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_farms_sync_location ON farms;
CREATE TRIGGER trg_farms_sync_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON farms
    FOR EACH ROW EXECUTE FUNCTION sync_farm_location();

-- backfill existing rows
UPDATE farms SET latitude = latitude WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
