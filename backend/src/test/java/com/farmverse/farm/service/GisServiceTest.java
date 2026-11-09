package com.farmverse.farm.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmverse.farm.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GisServiceTest {
    private final ObjectMapper mapper = new ObjectMapper();

    private void check(String json) throws Exception {
        GisService.validatePolygon(mapper.readTree(json));
    }

    @Test
    void acceptsClosedPolygon() {
        assertDoesNotThrow(() -> check("{\"type\":\"Polygon\",\"coordinates\":[[[72.8,19.0],[72.9,19.0],[72.9,19.1],[72.8,19.0]]]}"));
    }

    @Test
    void rejectsWrongTypeOpenRingAndOutOfRange() {
        assertThrows(BadRequestException.class, () -> check("{\"type\":\"Point\",\"coordinates\":[1,2]}"));
        assertThrows(BadRequestException.class, () -> check("{\"type\":\"Polygon\",\"coordinates\":[[[72.8,19.0],[72.9,19.0],[72.9,19.1],[72.7,19.0]]]}"));
        assertThrows(BadRequestException.class, () -> check("{\"type\":\"Polygon\",\"coordinates\":[[[200,19.0],[72.9,19.0],[72.9,19.1],[200,19.0]]]}"));
        assertThrows(BadRequestException.class, () -> check("{\"type\":\"Polygon\",\"coordinates\":[[[1,1],[2,2],[1,1]]]}"));
        assertThrows(BadRequestException.class, () -> GisService.validatePolygon(mapper.missingNode()));
    }
}
