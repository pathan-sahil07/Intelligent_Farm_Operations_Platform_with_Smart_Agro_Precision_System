package com.farmverse.farm.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.service.GisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/gis")
@RequiredArgsConstructor
public class GisController {
    private final GisService gis;
    private final FarmAccessService access;
    private final AuditService audit;

    public record LocationRequest(BigDecimal latitude, BigDecimal longitude) {
    }

    @GetMapping("/farms")
    @PreAuthorize("hasAuthority('GIS_READ')")
    public Map<String, Object> farms() {
        return gis.farmFeatures(access.accessibleFarmIds());
    }

    @GetMapping("/farms/{farmId}/plots")
    @PreAuthorize("hasAuthority('GIS_READ')")
    public Map<String, Object> plots(@PathVariable Long farmId) {
        access.requireAccess(farmId);
        return gis.plotFeatures(farmId);
    }

    @PutMapping("/plots/{plotId}/boundary")
    @PreAuthorize("hasAuthority('GIS_WRITE')")
    public Map<String, Object> setBoundary(@PathVariable Long plotId, @RequestBody JsonNode body) {
        access.requirePlotAccess(plotId);
        Map<String, Object> feature = gis.setBoundary(plotId, body.path("geometry"));
        audit.log("SET_BOUNDARY", "PLOT", plotId, null);
        return feature;
    }

    @DeleteMapping("/plots/{plotId}/boundary")
    @PreAuthorize("hasAuthority('GIS_WRITE')")
    public ResponseEntity<Void> clearBoundary(@PathVariable Long plotId) {
        access.requirePlotAccess(plotId);
        gis.clearBoundary(plotId);
        audit.log("CLEAR_BOUNDARY", "PLOT", plotId, null);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/farms/{farmId}/location")
    @PreAuthorize("hasAuthority('GIS_WRITE')")
    public ResponseEntity<Void> setLocation(@PathVariable Long farmId, @RequestBody LocationRequest body) {
        access.requireAccess(farmId);
        if (body.latitude() == null || body.longitude() == null
                || body.latitude().abs().compareTo(BigDecimal.valueOf(90)) > 0
                || body.longitude().abs().compareTo(BigDecimal.valueOf(180)) > 0) {
            throw new BadRequestException("latitude (-90..90) and longitude (-180..180) are required");
        }
        gis.setFarmLocation(farmId, body.latitude(), body.longitude());
        audit.log("SET_LOCATION", "FARM", farmId, body.latitude() + "," + body.longitude());
        return ResponseEntity.noContent().build();
    }
}
