package com.farmverse.farm.controller;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.repository.FarmRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gis")
@RequiredArgsConstructor
public class GisController {
    private final FarmRepository farms;

    @GetMapping("/farms")
    public Map<String, Object> farms() {
        List<Map<String, Object>> features = farms.findAll().stream()
                .filter(farm -> farm.getLatitude() != null && farm.getLongitude() != null)
                .map(this::feature)
                .toList();
        return Map.of("type", "FeatureCollection", "features", features);
    }

    private Map<String, Object> feature(Farm farm) {
        return Map.of(
                "type", "Feature",
                "geometry", Map.of(
                        "type", "Point",
                        "coordinates", List.of(farm.getLongitude(), farm.getLatitude())),
                "properties", Map.of("id", farm.getId(), "name", farm.getName()));
    }
}
