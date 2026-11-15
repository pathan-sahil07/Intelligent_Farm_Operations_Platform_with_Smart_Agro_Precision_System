package com.farmverse.farm.controller;

import com.farmverse.farm.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {
    private final WeatherService weather;

    /** Raw provider response for coordinates (kept for compatibility). Authenticated, not an open proxy. */
    @GetMapping
    @PreAuthorize("hasAuthority('WEATHER_READ')")
    public Map<?, ?> current(@RequestParam double latitude, @RequestParam double longitude) {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new com.farmverse.farm.exception.BadRequestException("Latitude or longitude out of range");
        }
        return weather.raw(latitude, longitude);
    }

    @GetMapping("/farms/{farmId}")
    @PreAuthorize("hasAuthority('WEATHER_READ')")
    public Map<String, Object> forFarm(@PathVariable Long farmId) {
        return weather.forFarm(farmId);
    }
}
