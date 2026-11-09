package com.farmverse.farm.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/** Authenticated proxy to the Gemini RAG service so the browser never talks to it (or its key) directly. */
@RestController
@RequestMapping("/api/assistant")
public class AssistantController {
    private final RestClient client;

    public AssistantController(@Value("${ai.service.url:http://localhost:8000}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(30000);
        this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    @PostMapping("/chat")
    public Map<?, ?> chat(@RequestBody Map<String, Object> body) {
        try {
            Map<?, ?> response = client.post().uri("/chat").body(body).retrieve().body(Map.class);
            return response == null ? Map.of() : response;
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "The assistant service is unavailable");
        }
    }
}
