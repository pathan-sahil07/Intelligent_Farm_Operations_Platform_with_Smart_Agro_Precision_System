package com.farmverse.farm.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

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
        try {
            String uri = UriComponentsBuilder.fromUriString(providerUrl)
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("current_weather", true)
                    .build()
                    .toUriString();
            Map<?, ?> response = client.get().uri(uri).retrieve().body(Map.class);
            return response == null ? Map.of() : response;
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Weather provider is unavailable", exception);
        }
    }
}
