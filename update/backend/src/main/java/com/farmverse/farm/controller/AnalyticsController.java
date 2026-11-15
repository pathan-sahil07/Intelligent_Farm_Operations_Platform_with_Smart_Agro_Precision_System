package com.farmverse.farm.controller;

import com.farmverse.farm.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ANALYTICS_READ')")
public class AnalyticsController {
    private final AnalyticsService service;

    private static final String ISO = "yyyy-MM-dd";

    @GetMapping("/overview")
    public Map<String, Object> overview(@RequestParam(required = false) Long farmId,
                                        @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate from,
                                        @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate to) {
        return service.overview(farmId, from, to);
    }

    @GetMapping("/production")
    public Map<String, Object> production(@RequestParam(required = false) Long farmId,
                                          @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate from,
                                          @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate to) {
        return service.production(farmId, from, to);
    }

    @GetMapping("/irrigation")
    public Map<String, Object> irrigation(@RequestParam(required = false) Long farmId,
                                          @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate from,
                                          @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate to) {
        return service.irrigation(farmId, from, to);
    }

    @GetMapping("/inventory")
    public Map<String, Object> inventory(@RequestParam(required = false) Long farmId,
                                         @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate to) {
        return service.inventory(farmId, from, to);
    }

    @GetMapping("/equipment")
    public Map<String, Object> equipment(@RequestParam(required = false) Long farmId,
                                         @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate to) {
        return service.equipment(farmId, from, to);
    }

    @GetMapping("/resources")
    public Map<String, Object> resources(@RequestParam(required = false) Long farmId,
                                         @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate to) {
        return service.resources(farmId, from, to);
    }

    @GetMapping("/costs")
    public Map<String, Object> costs(@RequestParam(required = false) Long farmId,
                                     @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate from,
                                     @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate to) {
        return service.costs(farmId, from, to);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam String report,
                                         @RequestParam(required = false) Long farmId,
                                         @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(pattern = ISO) LocalDate to) {
        String csv = service.exportCsv(report, farmId, from, to);
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(report + "-report.csv").build().toString())
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }
}
