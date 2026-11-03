package com.farmverse.farm.service;

import com.farmverse.farm.dto.FarmUpdateRequest;
import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.integration.UserDirectory;
import com.farmverse.farm.repository.FarmRepository;
import com.farmverse.farm.repository.FarmWorkerRepository;
import com.farmverse.farm.repository.LandDocumentRepository;
import com.farmverse.farm.repository.PlotRepository;
import com.farmverse.farm.repository.SoilTestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FarmServiceTest {

    @Mock FarmRepository farmRepo;
    @Mock PlotRepository plotRepo;
    @Mock FarmWorkerRepository workerRepo;
    @Mock SoilTestRepository soilTestRepo;
    @Mock LandDocumentRepository documentRepo;
    @Mock LandDocumentService documentService;
    @Mock UserDirectory userDirectory;
    @InjectMocks FarmService service;

    private Farm farm() {
        Farm f = new Farm();
        f.setId(1L);
        f.setName("Green Valley");
        f.setOwnerId(1L);
        f.setTotalAreaAcres(new BigDecimal("10"));
        return f;
    }

    private FarmUpdateRequest request(String area) {
        return new FarmUpdateRequest("Green Valley", null, null, null, null, null, new BigDecimal(area));
    }

    @Test
    void updateCannotShrinkFarmBelowPlottedArea() {
        when(farmRepo.findById(1L)).thenReturn(Optional.of(farm()));
        when(plotRepo.sumAreaByFarmId(1L)).thenReturn(new BigDecimal("6"));

        assertThrows(BadRequestException.class, () -> service.update(1L, request("5")));
    }

    @Test
    void listRejectsOwnerAndWorkerTogether() {
        assertThrows(BadRequestException.class, () -> service.list(1L, 2L));
    }

    @Test
    void listByWorkerReturnsAssignedFarms() {
        when(farmRepo.findByWorkerUserId(7L)).thenReturn(List.of(farm()));

        assertEquals(1, service.list(null, 7L).size());
        verify(farmRepo).findByWorkerUserId(7L);
    }

    @Test
    void createRejectsDuplicateFarmNameForSameOwner() {
        when(farmRepo.existsByOwnerIdAndNameIgnoreCase(1L, "Green Valley")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> service.create(farm()));
    }
}
