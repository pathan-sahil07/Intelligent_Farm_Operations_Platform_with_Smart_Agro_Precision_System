package com.farmverse.farm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.exception.ConflictException;
import com.farmverse.farm.notification.NotificationService;
import com.farmverse.farm.security.FarmAccessService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reads real weather from a configurable Open-Meteo compatible provider. Nothing is ever fabricated: when the
 * provider is not configured or unreachable the caller gets HTTP 503.
 */
@Service
public class WeatherService {
    public record Current(String time, Double temperatureC, Double humidityPercent, Double windSpeedKmh,
                          Double precipitationMm, Integer weatherCode) {
    }

    public record Day(String date, Double tempMaxC, Double tempMinC, Double precipitationMm,
                      Double precipitationProbability, Double windMaxKmh) {
    }

    public record Forecast(Current current, List<Day> days) {
    }

    public record Alert(String type, String severity, String date, String message) {
    }

    // Thresholds (documented in docs/DEPLOYMENT.md): rain mm/day, wind km/h, temperature degrees C
    static final double RAIN_WARN = 30, RAIN_SEVERE = 60;
    static final double WIND_WARN = 40, WIND_SEVERE = 60;
    static final double HEAT_WARN = 38, HEAT_SEVERE = 42;
    static final double FROST_WARN = 2, FROST_SEVERE = -2;

    private final String providerUrl;
    private final RestClient client;
    private final FarmService farms;
    private final FarmAccessService access;
    private final NotificationService notifications;

    public WeatherService(@Value("${weather.provider.url:}") String providerUrl, FarmService farms,
                          FarmAccessService access, NotificationService notifications) {
        this.providerUrl = providerUrl;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(8000);
        this.client = RestClient.builder().requestFactory(factory).build();
        this.farms = farms;
        this.access = access;
        this.notifications = notifications;
    }

    /** Raw provider JSON for a coordinate pair (kept for backward compatibility). */
    public Map<?, ?> raw(double latitude, double longitude) {
        requireConfigured();
        String uri = UriComponentsBuilder.fromUriString(providerUrl)
                .queryParam("latitude", latitude).queryParam("longitude", longitude)
                .queryParam("current_weather", true).build().toUriString();
        try {
            Map<?, ?> response = client.get().uri(uri).retrieve().body(Map.class);
            return response == null ? Map.of() : response;
        } catch (RestClientException e) {
            throw unavailable(e);
        }
    }

    public Map<String, Object> forFarm(Long farmId) {
        access.requireAccess(farmId);
        Farm farm = farms.get(farmId);
        if (farm.getLatitude() == null || farm.getLongitude() == null) {
            throw new ConflictException("This farm has no coordinates; set its location first");
        }
        Forecast report = forecast(farm.getLatitude(), farm.getLongitude());
        List<Day> forecast = report.days();
        Current current = report.current();
        List<Alert> alerts = deriveAlerts(forecast);
        for (Alert a : alerts) {
            notifications.notifyFarm(farmId, "WEATHER", a.type().replace('_', ' ') + " alert for " + a.date(),
                    farm.getName() + ": " + a.message(), "/weather", "weather:" + farmId + ":" + a.date() + ":" + a.type());
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("farmId", farmId);
        result.put("latitude", farm.getLatitude());
        result.put("longitude", farm.getLongitude());
        result.put("source", providerUrl);
        result.put("current", current);
        result.put("forecast", forecast);
        result.put("alerts", alerts);
        return result;
    }

    /** Current conditions plus the 7-day forecast. */
    public Forecast forecast(BigDecimal latitude, BigDecimal longitude) {
        requireConfigured();
        String uri = UriComponentsBuilder.fromUriString(providerUrl)
                .queryParam("latitude", latitude).queryParam("longitude", longitude)
                .queryParam("current", "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code")
                .queryParam("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max")
                .queryParam("timezone", "auto").queryParam("forecast_days", 7)
                .build().toUriString();
        JsonNode json = fetch(uri);
        return new Forecast(parseCurrent(json.path("current")), parseDaily(json.path("daily")));
    }

    /** Test seam. */
    JsonNode fetch(String uri) {
        try {
            JsonNode body = client.get().uri(uri).retrieve().body(JsonNode.class);
            if (body == null || body.isMissingNode()) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty weather response");
            return body;
        } catch (RestClientException e) {
            throw unavailable(e);
        }
    }

    static Current parseCurrent(JsonNode c) {
        if (c == null || c.isMissingNode() || c.isNull()) return null;
        return new Current(text(c, "time"), num(c, "temperature_2m"), num(c, "relative_humidity_2m"),
                num(c, "wind_speed_10m"), num(c, "precipitation"),
                c.hasNonNull("weather_code") ? c.get("weather_code").asInt() : null);
    }

    static List<Day> parseDaily(JsonNode d) {
        List<Day> days = new ArrayList<>();
        JsonNode dates = d.path("time");
        for (int i = 0; i < dates.size(); i++) {
            days.add(new Day(dates.get(i).asText(), at(d, "temperature_2m_max", i), at(d, "temperature_2m_min", i),
                    at(d, "precipitation_sum", i), at(d, "precipitation_probability_max", i),
                    at(d, "wind_speed_10m_max", i)));
        }
        return days;
    }

    /** Alerts come only from real forecast values and the thresholds above. */
    public static List<Alert> deriveAlerts(List<Day> days) {
        List<Alert> alerts = new ArrayList<>();
        for (Day d : days) {
            if (d.precipitationMm() != null && d.precipitationMm() >= RAIN_WARN) {
                alerts.add(new Alert("HEAVY_RAIN", d.precipitationMm() >= RAIN_SEVERE ? "SEVERE" : "WARNING", d.date(),
                        "Heavy rain expected: " + d.precipitationMm() + " mm."));
            }
            if (d.windMaxKmh() != null && d.windMaxKmh() >= WIND_WARN) {
                alerts.add(new Alert("HIGH_WIND", d.windMaxKmh() >= WIND_SEVERE ? "SEVERE" : "WARNING", d.date(),
                        "Strong wind expected: up to " + d.windMaxKmh() + " km/h."));
            }
            if (d.tempMaxC() != null && d.tempMaxC() >= HEAT_WARN) {
                alerts.add(new Alert("HEAT", d.tempMaxC() >= HEAT_SEVERE ? "SEVERE" : "WARNING", d.date(),
                        "Extreme heat expected: up to " + d.tempMaxC() + " °C."));
            }
            if (d.tempMinC() != null && d.tempMinC() <= FROST_WARN) {
                alerts.add(new Alert("FROST", d.tempMinC() <= FROST_SEVERE ? "SEVERE" : "WARNING", d.date(),
                        "Frost risk: minimum " + d.tempMinC() + " °C."));
            }
        }
        return alerts;
    }

    private void requireConfigured() {
        if (providerUrl == null || providerUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Weather provider is not configured");
        }
    }

    private static ResponseStatusException unavailable(Exception e) {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Weather provider is unavailable", e);
    }

    private static Double num(JsonNode n, String field) {
        return n.hasNonNull(field) && n.get(field).isNumber() ? n.get(field).asDouble() : null;
    }

    private static String text(JsonNode n, String field) {
        return n.hasNonNull(field) ? n.get(field).asText() : null;
    }

    private static Double at(JsonNode d, String field, int i) {
        JsonNode arr = d.path(field);
        return arr.isArray() && arr.size() > i && arr.get(i).isNumber() ? arr.get(i).asDouble() : null;
    }
}
