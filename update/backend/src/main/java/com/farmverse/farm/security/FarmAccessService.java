package com.farmverse.farm.security;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.LandDocument;
import com.farmverse.farm.entity.Plot;
import com.farmverse.farm.entity.SoilTest;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Farm-level authorization. ADMIN sees every farm. Everyone else sees farms they own or are assigned to.
 * A farm the caller cannot see is reported as "access denied" (403).
 */
@Service("farmAccess")
public class FarmAccessService {
    private final FarmRepository farms;
    private final FarmWorkerRepository workers;
    private final PlotRepository plots;
    private final SoilTestRepository soilTests;
    private final LandDocumentRepository documents;

    public FarmAccessService(FarmRepository farms, FarmWorkerRepository workers, PlotRepository plots,
                             SoilTestRepository soilTests, LandDocumentRepository documents) {
        this.farms = farms;
        this.workers = workers;
        this.plots = plots;
        this.soilTests = soilTests;
        this.documents = documents;
    }

    @Transactional(readOnly = true)
    public boolean canRead(Long farmId) {
        if (farmId == null) return false;
        AppUserPrincipal user = CurrentUser.find().orElse(null);
        if (user == null) return false;
        if (user.isAdmin()) return true;
        return farms.findById(farmId)
                .map(f -> user.getId().equals(f.getOwnerId())
                        || workers.existsByFarm_IdAndUserId(farmId, user.getId()))
                .orElse(false);
    }

    /** Write access needs farm access; the matching permission is checked separately via @PreAuthorize. */
    public boolean canWrite(Long farmId) {
        return canRead(farmId);
    }

    public void requireAccess(Long farmId) {
        if (!canRead(farmId)) {
            throw new AccessDeniedException("You do not have access to this farm");
        }
    }

    @Transactional(readOnly = true)
    public boolean isOwnerOrAdmin(Long farmId) {
        AppUserPrincipal user = CurrentUser.find().orElse(null);
        if (user == null || farmId == null) return false;
        if (user.isAdmin()) return true;
        return farms.findById(farmId).map(f -> user.getId().equals(f.getOwnerId())).orElse(false);
    }

    /** Farms a listing may include. {@code legacy} lets ADMIN also see old rows that have no farm. */
    public record Scope(Set<Long> ids, boolean legacy) {
    }

    /** Resolves an optional farmId filter into the farms the caller may read (never empty: holds a -1 sentinel). */
    @Transactional(readOnly = true)
    public Scope scope(Long farmId) {
        if (farmId != null) {
            requireAccess(farmId);
            return new Scope(Set.of(farmId), false);
        }
        Set<Long> ids = new HashSet<>(accessibleFarmIds());
        ids.add(-1L);
        return new Scope(ids, CurrentUser.get().isAdmin());
    }

    /** Access check for rows that may predate farm scoping (farm_id NULL): only ADMIN may touch those. */
    public void requireFarmOrLegacy(Long farmId) {
        if (farmId == null) {
            if (!CurrentUser.get().isAdmin()) {
                throw new AccessDeniedException("This record is not assigned to a farm");
            }
            return;
        }
        requireAccess(farmId);
    }

    /** Owner, ADMIN, or an assigned FARM_MANAGER may assign staff to a farm. */
    @Transactional(readOnly = true)
    public boolean canAssignStaff(Long farmId) {
        AppUserPrincipal user = CurrentUser.find().orElse(null);
        if (user == null) return false;
        return isOwnerOrAdmin(farmId) || ("FARM_MANAGER".equals(user.getRole()) && canRead(farmId));
    }

    /** Ids of farms visible to the caller. For ADMIN this is every farm. */
    @Transactional(readOnly = true)
    public Set<Long> accessibleFarmIds() {
        AppUserPrincipal user = CurrentUser.get();
        Set<Long> ids = new HashSet<>();
        if (user.isAdmin()) {
            farms.findAll().forEach(f -> ids.add(f.getId()));
        } else {
            farms.findByOwnerId(user.getId()).forEach(f -> ids.add(f.getId()));
            farms.findByWorkerUserId(user.getId()).forEach(f -> ids.add(f.getId()));
        }
        return ids;
    }

    public void requirePlotAccess(Long plotId) {
        Plot plot = plots.findById(plotId)
                .orElseThrow(() -> new ResourceNotFoundException("Plot not found with ID: " + plotId));
        requireAccess(plot.getFarm().getId());
    }

    public void requireSoilTestAccess(Long soilTestId) {
        SoilTest test = soilTests.findById(soilTestId)
                .orElseThrow(() -> new ResourceNotFoundException("Soil test not found with ID: " + soilTestId));
        requireAccess(test.getPlot().getFarm().getId());
    }

    public void requireDocumentAccess(Long documentId) {
        LandDocument doc = documents.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));
        requireAccess(doc.getFarm().getId());
    }

    /** Farm lookup used by services that must verify an entity-level farm id. */
    public Farm requireFarm(Long farmId) {
        requireAccess(farmId);
        return farms.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found with ID: " + farmId));
    }
}
