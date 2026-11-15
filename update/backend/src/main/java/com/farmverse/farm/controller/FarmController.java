package com.farmverse.farm.controller;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.dto.FarmSummaryResponse;
import com.farmverse.farm.dto.FarmUpdateRequest;
import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.security.AppUserPrincipal;
import com.farmverse.farm.security.CurrentUser;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.service.FarmDashboardService;
import com.farmverse.farm.service.FarmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;
    private final FarmDashboardService dashboardService;
    private final FarmAccessService access;
    private final AuditService audit;

    @PostMapping
    @PreAuthorize("hasAuthority('FARM_WRITE')")
    public ResponseEntity<Farm> create(@Valid @RequestBody Farm farm) {
        AppUserPrincipal user = CurrentUser.get();
        if (!user.isAdmin()) {
            farm.setOwnerId(user.getId()); // owners can only create farms for themselves
        }
        Farm created = farmService.create(farm);
        audit.log("CREATE", "FARM", created.getId(), created.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // GET /api/farms, /api/farms?ownerId=3 or /api/farms?workerId=7 - always limited to farms the caller may see
    @GetMapping
    @PreAuthorize("hasAuthority('FARM_READ')")
    public List<Farm> list(@RequestParam(required = false) Long ownerId,
                           @RequestParam(required = false) Long workerId) {
        List<Farm> farms = farmService.list(ownerId, workerId);
        if (CurrentUser.get().isAdmin()) {
            return farms;
        }
        Set<Long> visible = access.accessibleFarmIds();
        return farms.stream().filter(f -> visible.contains(f.getId())).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('FARM_READ')")
    public Farm get(@PathVariable Long id) {
        access.requireAccess(id);
        return farmService.get(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('FARM_WRITE')")
    public Farm update(@PathVariable Long id, @Valid @RequestBody FarmUpdateRequest request) {
        access.requireAccess(id);
        Farm updated = farmService.update(id, request);
        audit.log("UPDATE", "FARM", id, updated.getName());
        return updated;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('FARM_DELETE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        access.requireAccess(id);
        if (!access.isOwnerOrAdmin(id)) {
            throw new org.springframework.security.access.AccessDeniedException("Only the farm owner or an administrator can delete a farm");
        }
        farmService.delete(id);
        audit.log("DELETE", "FARM", id, null);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/summary")
    @PreAuthorize("hasAuthority('FARM_READ')")
    public FarmSummaryResponse summary(@PathVariable Long id) {
        access.requireAccess(id);
        return farmService.summary(id);
    }

    @GetMapping("/{id}/dashboard")
    @PreAuthorize("hasAuthority('FARM_READ')")
    public Map<String, Object> dashboard(@PathVariable Long id) {
        access.requireAccess(id);
        return dashboardService.dashboard(id);
    }
}
