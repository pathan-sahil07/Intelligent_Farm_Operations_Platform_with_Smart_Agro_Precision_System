package com.farmverse.farm.security;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FarmAccessServiceTest {
    @Mock FarmRepository farms;
    @Mock FarmWorkerRepository workers;
    @Mock PlotRepository plots;
    @Mock SoilTestRepository soilTests;
    @Mock LandDocumentRepository documents;
    FarmAccessService service;

    @BeforeEach
    void setUp() {
        service = new FarmAccessService(farms, workers, plots, soilTests, documents);
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private void login(long id, String role) {
        AppUserPrincipal p = new AppUserPrincipal(id, "u" + id + "@x.y", "User " + id, role, true, Set.of());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities()));
    }

    private Farm farm(long id, long owner) {
        Farm f = new Farm();
        f.setId(id);
        f.setOwnerId(owner);
        return f;
    }

    @Test
    void adminCanReadAnyFarm() {
        login(1, "ADMIN");
        assertTrue(service.canRead(99L));
    }

    @Test
    void ownerCanReadOwnFarmButNotOthers() {
        login(5, "FARM_OWNER");
        when(farms.findById(10L)).thenReturn(Optional.of(farm(10, 5)));
        when(farms.findById(11L)).thenReturn(Optional.of(farm(11, 6)));
        when(workers.existsByFarm_IdAndUserId(11L, 5L)).thenReturn(false);
        assertTrue(service.canRead(10L));
        assertFalse(service.canRead(11L));
        assertThrows(AccessDeniedException.class, () -> service.requireAccess(11L));
    }

    @Test
    void assignedWorkerCanReadFarm() {
        login(7, "FIELD_WORKER");
        when(farms.findById(11L)).thenReturn(Optional.of(farm(11, 6)));
        when(workers.existsByFarm_IdAndUserId(11L, 7L)).thenReturn(true);
        assertTrue(service.canRead(11L));
    }

    @Test
    void unknownFarmAndAnonymousAreDenied() {
        assertFalse(service.canRead(1L));
        login(7, "FIELD_WORKER");
        when(farms.findById(404L)).thenReturn(Optional.empty());
        assertFalse(service.canRead(404L));
    }

    @Test
    void accessibleFarmIdsCombinesOwnedAndAssigned() {
        login(5, "FARM_MANAGER");
        when(farms.findByOwnerId(5L)).thenReturn(List.of(farm(1, 5)));
        when(farms.findByWorkerUserId(5L)).thenReturn(List.of(farm(2, 9)));
        assertEquals(Set.of(1L, 2L), service.accessibleFarmIds());
    }

    @Test
    void scopeAlwaysContainsSentinelAndOnlyAdminSeesLegacyRows() {
        login(5, "FARM_OWNER");
        when(farms.findByOwnerId(5L)).thenReturn(List.of());
        when(farms.findByWorkerUserId(5L)).thenReturn(List.of());
        FarmAccessService.Scope scope = service.scope(null);
        assertTrue(scope.ids().contains(-1L));
        assertFalse(scope.legacy());
        login(1, "ADMIN");
        when(farms.findAll()).thenReturn(List.of());
        assertTrue(service.scope(null).legacy());
    }

    @Test
    void legacyRowsWithoutFarmAreAdminOnly() {
        login(5, "FARM_OWNER");
        assertThrows(AccessDeniedException.class, () -> service.requireFarmOrLegacy(null));
        login(1, "ADMIN");
        assertDoesNotThrow(() -> service.requireFarmOrLegacy(null));
    }

    @Test
    void onlyOwnerAdminOrAssignedManagerMayAssignStaff() {
        login(5, "FARM_OWNER");
        when(farms.findById(10L)).thenReturn(Optional.of(farm(10, 5)));
        assertTrue(service.canAssignStaff(10L));
        login(8, "FIELD_WORKER");
        assertFalse(service.canAssignStaff(10L));
        login(9, "FARM_MANAGER");
        when(workers.existsByFarm_IdAndUserId(10L, 9L)).thenReturn(true);
        assertTrue(service.canAssignStaff(10L));
    }
}
