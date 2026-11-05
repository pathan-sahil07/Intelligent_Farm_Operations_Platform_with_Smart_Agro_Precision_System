package com.farmverse.farm.service;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.FarmWorker;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.integration.UserDirectory;
import com.farmverse.farm.repository.FarmWorkerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FarmWorkerServiceTest {

    @Mock FarmWorkerRepository workerRepo;
    @Mock FarmService farmService;
    @Mock UserDirectory userDirectory;
    @InjectMocks FarmWorkerService service;

    private Farm farm() {
        Farm f = new Farm();
        f.setId(1L);
        return f;
    }

    @Test
    void assignRejectsUserWhoIsNotAFieldWorker() {
        when(farmService.get(1L)).thenReturn(farm());
        when(userDirectory.isFieldWorker(5L)).thenReturn(false);

        assertThrows(BadRequestException.class, () -> service.assign(1L, 5L));
    }

    @Test
    void assignRejectsDuplicateAssignment() {
        when(farmService.get(1L)).thenReturn(farm());
        when(userDirectory.isFieldWorker(5L)).thenReturn(true);
        when(workerRepo.existsByFarm_IdAndUserId(1L, 5L)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> service.assign(1L, 5L));
    }

    @Test
    void assignSavesValidWorker() {
        when(farmService.get(1L)).thenReturn(farm());
        when(userDirectory.isFieldWorker(5L)).thenReturn(true);
        when(workerRepo.save(any(FarmWorker.class))).thenAnswer(i -> i.getArgument(0));

        FarmWorker fw = service.assign(1L, 5L);

        assertEquals(5L, fw.getUserId());
    }
}
