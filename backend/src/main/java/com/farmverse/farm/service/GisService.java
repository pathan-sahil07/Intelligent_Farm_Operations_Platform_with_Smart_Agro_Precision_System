package com.farmverse.farm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/** Spatial reads/writes using native PostGIS SQL. Geometry columns are deliberately not mapped on JPA entities. */
@Service
public class GisService {
    private static final String ACRES = "4046.8564224";
    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public GisService(NamedParameterJdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> farmFeatures(Collection<Long> farmIds) {
        List<Map<String, Object>> features = new ArrayList<>();
        if (!farmIds.isEmpty()) {
            jdbc.query("""
                    select id, name, total_area_acres, latitude, longitude
                    from farms where id in (:ids) and latitude is not null and longitude is not null
                    order by name""", new MapSqlParameterSource("ids", farmIds), rs -> {
                Map<String, Object> props = new LinkedHashMap<>();
                props.put("id", rs.getLong("id"));
                props.put("name", rs.getString("name"));
                props.put("totalAreaAcres", rs.getBigDecimal("total_area_acres"));
                Map<String, Object> geometry = new LinkedHashMap<>();
                geometry.put("type", "Point");
                geometry.put("coordinates", List.of(rs.getBigDecimal("longitude"), rs.getBigDecimal("latitude")));
                features.add(feature(geometry, props));
            });
        }
        return collection(features);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> plotFeatures(Long farmId) {
        List<Map<String, Object>> features = new ArrayList<>();
        jdbc.query("""
                select id, name, area_acres, soil_type,
                       ST_AsGeoJSON(boundary) as geojson,
                       case when boundary is null then null
                            else round((ST_Area(boundary::geography) / %s)::numeric, 3) end as computed_acres
                from plots where farm_id = :farmId order by name""".formatted(ACRES),
                new MapSqlParameterSource("farmId", farmId), rs -> {
                    features.add(plotFeature(rs.getLong("id"), rs.getString("name"), rs.getBigDecimal("area_acres"),
                            rs.getString("soil_type"), rs.getString("geojson"), rs.getBigDecimal("computed_acres")));
                });
        return collection(features);
    }

    @Transactional
    public Map<String, Object> setBoundary(Long plotId, JsonNode geometry) {
        validatePolygon(geometry);
        String geojson;
        try {
            geojson = mapper.writeValueAsString(geometry);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Invalid geometry");
        }
        try {
            Boolean valid = jdbc.queryForObject(
                    "select ST_IsValid(ST_SetSRID(ST_GeomFromGeoJSON(:g), 4326))",
                    new MapSqlParameterSource("g", geojson), Boolean.class);
            if (!Boolean.TRUE.equals(valid)) {
                throw new BadRequestException("Boundary is not a valid polygon (self-intersecting or degenerate)");
            }
            int updated = jdbc.update("update plots set boundary = ST_SetSRID(ST_GeomFromGeoJSON(:g), 4326) where id = :id",
                    new MapSqlParameterSource("g", geojson).addValue("id", plotId));
            if (updated == 0) throw new ResourceNotFoundException("Plot not found with ID: " + plotId);
        } catch (DataAccessException e) {
            throw new BadRequestException("Boundary could not be stored: invalid GeoJSON polygon");
        }
        return plotFeature(plotId);
    }

    @Transactional
    public void clearBoundary(Long plotId) {
        int updated = jdbc.update("update plots set boundary = null where id = :id", new MapSqlParameterSource("id", plotId));
        if (updated == 0) throw new ResourceNotFoundException("Plot not found with ID: " + plotId);
    }

    @Transactional
    public void setFarmLocation(Long farmId, BigDecimal latitude, BigDecimal longitude) {
        // farms.location is kept in sync by a database trigger (V6)
        int updated = jdbc.update("update farms set latitude = :lat, longitude = :lng where id = :id",
                new MapSqlParameterSource("lat", latitude).addValue("lng", longitude).addValue("id", farmId));
        if (updated == 0) throw new ResourceNotFoundException("Farm not found with ID: " + farmId);
    }

    private Map<String, Object> plotFeature(Long plotId) {
        return jdbc.queryForObject("""
                select id, name, area_acres, soil_type, ST_AsGeoJSON(boundary) as geojson,
                       case when boundary is null then null
                            else round((ST_Area(boundary::geography) / %s)::numeric, 3) end as computed_acres
                from plots where id = :id""".formatted(ACRES), new MapSqlParameterSource("id", plotId),
                (rs, i) -> plotFeature(rs.getLong("id"), rs.getString("name"), rs.getBigDecimal("area_acres"),
                        rs.getString("soil_type"), rs.getString("geojson"), rs.getBigDecimal("computed_acres")));
    }

    private Map<String, Object> plotFeature(Long id, String name, BigDecimal area, String soil, String geojson,
                                            BigDecimal computed) {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("id", id);
        props.put("name", name);
        props.put("areaAcres", area);
        props.put("computedAreaAcres", computed);
        props.put("soilType", soil);
        Object geometry = null;
        if (geojson != null) {
            try {
                geometry = mapper.readValue(geojson, Map.class);
            } catch (JsonProcessingException e) {
                throw new IllegalStateException("Stored geometry is not valid GeoJSON", e);
            }
        }
        return feature(geometry, props);
    }

    private static Map<String, Object> feature(Object geometry, Map<String, Object> properties) {
        Map<String, Object> f = new LinkedHashMap<>();
        f.put("type", "Feature");
        f.put("geometry", geometry);
        f.put("properties", properties);
        return f;
    }

    private static Map<String, Object> collection(List<Map<String, Object>> features) {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("type", "FeatureCollection");
        c.put("features", features);
        return c;
    }

    /** Structural GeoJSON checks that do not need the database. */
    static void validatePolygon(JsonNode g) {
        if (g == null || !"Polygon".equals(g.path("type").asText())) {
            throw new BadRequestException("geometry must be a GeoJSON Polygon");
        }
        JsonNode rings = g.path("coordinates");
        if (!rings.isArray() || rings.isEmpty()) throw new BadRequestException("Polygon has no coordinates");
        for (JsonNode ring : rings) {
            if (!ring.isArray() || ring.size() < 4) {
                throw new BadRequestException("Each polygon ring needs at least 4 points (first equals last)");
            }
            for (JsonNode point : ring) {
                if (!point.isArray() || point.size() < 2 || !point.get(0).isNumber() || !point.get(1).isNumber()) {
                    throw new BadRequestException("Coordinates must be [longitude, latitude] numbers");
                }
                double lng = point.get(0).asDouble();
                double lat = point.get(1).asDouble();
                if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
                    throw new BadRequestException("Coordinates out of range (longitude -180..180, latitude -90..90)");
                }
            }
            if (!ring.get(0).equals(ring.get(ring.size() - 1))) {
                throw new BadRequestException("Polygon ring must be closed (first point equals last point)");
            }
        }
    }
}
