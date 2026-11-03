package com.farmverse.farm.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {
    private final RestClient client = RestClient.builder().build();
    private final String providerUrl;

    public WeatherController(@Value("${weather.provider.url:}") String providerUrl) {
        this.providerUrl = providerUrl;
    }

    @GetMapping
    public Map<?, ?> current(@RequestParam double latitude, @RequestParam double longitude) {
        if (providerUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Weather provider is not configured");
        }
        Map<?, ?> response = client.get()
                .uri(providerUrl + "?latitude={latitude}&longitude={longitude}", latitude, longitude)
                .retrieve()
                .body(Map.class);
        return response == null ? Map.of() : response;
    }
}
