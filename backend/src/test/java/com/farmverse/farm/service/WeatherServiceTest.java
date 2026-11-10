package com.farmverse.farm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class WeatherServiceTest {
    private static final String PROVIDER_JSON = """
            {"current":{"time":"2026-11-09T10:00","temperature_2m":31.5,"relative_humidity_2m":62,
                        "precipitation":0.0,"wind_speed_10m":12.4,"weather_code":3},
             "daily":{"time":["2026-11-09","2026-11-10","2026-11-11"],
                      "temperature_2m_max":[31.0,43.0,30.0],"temperature_2m_min":[22.0,1.0,-3.0],
                      "precipitation_sum":[0.0,65.0,31.0],"precipitation_probability_max":[10,90,60],
                      "wind_speed_10m_max":[15.0,45.0,70.0]}}""";

    private JsonNode json() throws Exception {
        return new ObjectMapper().readTree(PROVIDER_JSON);
    }

    @Test
    void parsesCurrentConditions() throws Exception {
        WeatherService.Current c = WeatherService.parseCurrent(json().path("current"));
        assertEquals(31.5, c.temperatureC());
        assertEquals(62.0, c.humidityPercent());
        assertEquals(12.4, c.windSpeedKmh());
        assertEquals(3, c.weatherCode());
    }

    @Test
    void parsesSevenDayStyleForecast() throws Exception {
        List<WeatherService.Day> days = WeatherService.parseDaily(json().path("daily"));
        assertEquals(3, days.size());
        assertEquals("2026-11-10", days.get(1).date());
        assertEquals(65.0, days.get(1).precipitationMm());
        assertEquals(90.0, days.get(1).precipitationProbability());
    }

    @Test
    void missingCurrentBlockIsNullNotInvented() throws Exception {
        assertNull(WeatherService.parseCurrent(new ObjectMapper().readTree("{}").path("current")));
    }

    @Test
    void alertsDeriveOnlyFromThresholdCrossings() throws Exception {
        List<WeatherService.Alert> alerts = WeatherService.deriveAlerts(WeatherService.parseDaily(json().path("daily")));
        assertTrue(alerts.stream().noneMatch(a -> a.date().equals("2026-11-09")), "calm day has no alerts");
        assertTrue(alerts.stream().anyMatch(a -> a.type().equals("HEAVY_RAIN") && a.severity().equals("SEVERE") && a.date().equals("2026-11-10")));
        assertTrue(alerts.stream().anyMatch(a -> a.type().equals("HEAT") && a.severity().equals("SEVERE")));
        assertTrue(alerts.stream().anyMatch(a -> a.type().equals("HIGH_WIND") && a.severity().equals("WARNING") && a.date().equals("2026-11-10")));
        assertTrue(alerts.stream().anyMatch(a -> a.type().equals("HIGH_WIND") && a.severity().equals("SEVERE") && a.date().equals("2026-11-11")));
        assertTrue(alerts.stream().anyMatch(a -> a.type().equals("FROST") && a.severity().equals("SEVERE")));
        assertTrue(alerts.stream().anyMatch(a -> a.type().equals("HEAVY_RAIN") && a.severity().equals("WARNING") && a.date().equals("2026-11-11")));
    }

    @Test
    void nullValuesProduceNoAlerts() {
        assertTrue(WeatherService.deriveAlerts(List.of(new WeatherService.Day("2026-11-09", null, null, null, null, null))).isEmpty());
    }
}
