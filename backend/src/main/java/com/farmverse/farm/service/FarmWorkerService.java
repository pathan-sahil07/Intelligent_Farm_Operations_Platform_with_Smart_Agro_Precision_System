package com.farmverse.farm.service;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.FarmWorker;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.integration.UserDirectory;
import com.farmverse.farm.repository.FarmWorkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FarmWorkerService {

    private final FarmWorkerRepository workerRepo;
    private final FarmService farmService;
    private final UserDirectory userDirectory;

    @Transactional
    public FarmWorker assign(Long farmId, Long userId) {
        Farm farm = farmService.get(farmId);
        if (!userDirectory.isFieldWorker(userId)) {
            throw new BadRequestException("User " + userId + " is not a Field Worker");
        }
        if (workerRepo.existsByFarm_IdAndUserId(farmId, userId)) {
            throw new BadRequestException("Worker " + userId + " is already assigned to this farm");
        }
        FarmWorker fw = new FarmWorker();
        fw.setFarm(farm);
        fw.setUserId(userId);
        return workerRepo.save(fw);
    }

    @Transactional
    public void unassign(Long farmId, Long userId) {
        FarmWorker fw = workerRepo.findByFarm_IdAndUserId(farmId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Worker " + userId + " is not assigned to farm " + farmId));
        workerRepo.delete(fw);
    }

    @Transactional(readOnly = true)
    public List<FarmWorker> list(Long farmId) {
        farmService.get(farmId);
        return workerRepo.findByFarm_Id(farmId);
    }
}
