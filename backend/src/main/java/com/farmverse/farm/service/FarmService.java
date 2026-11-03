package com.farmverse.farm.service;

import com.farmverse.farm.dto.FarmSummaryResponse;
import com.farmverse.farm.dto.FarmSummaryResponse.PlotWithSoil;
import com.farmverse.farm.dto.FarmSummaryResponse.WorkerInfo;
import com.farmverse.farm.dto.FarmUpdateRequest;
import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.FarmWorker;
import com.farmverse.farm.entity.Plot;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.integration.UserDirectory;
import com.farmverse.farm.repository.FarmRepository;
import com.farmverse.farm.repository.FarmWorkerRepository;
import com.farmverse.farm.repository.LandDocumentRepository;
import com.farmverse.farm.repository.PlotRepository;
import com.farmverse.farm.repository.SoilTestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FarmService {

    private final FarmRepository farmRepo;
    private final PlotRepository plotRepo;
    private final FarmWorkerRepository workerRepo;
    private final SoilTestRepository soilTestRepo;
    private final LandDocumentRepository documentRepo;
    private final LandDocumentService documentService;
    private final UserDirectory userDirectory;

    public FarmService(
            FarmRepository farmRepo,
            PlotRepository plotRepo,
            FarmWorkerRepository workerRepo,
            SoilTestRepository soilTestRepo,
            LandDocumentRepository documentRepo,
            LandDocumentService documentService,
            UserDirectory userDirectory) {
        this.farmRepo = farmRepo;
        this.plotRepo = plotRepo;
        this.workerRepo = workerRepo;
        this.soilTestRepo = soilTestRepo;
        this.documentRepo = documentRepo;
        this.documentService = documentService;
        this.userDirectory = userDirectory;
    }

    @Transactional
    public Farm create(Farm farm) {
        farm.setId(null); // never let a client overwrite an existing farm via POST
        farm.setName(farm.getName().trim());
        if (farmRepo.existsByOwnerIdAndNameIgnoreCase(farm.getOwnerId(), farm.getName())) {
            throw new BadRequestException(
                    "This owner already has a farm named '" + farm.getName() + "'");
        }
        return farmRepo.save(farm);
    }

    /** ownerId: farms owned by a user. workerId: farms a field worker is assigned to. */
    @Transactional(readOnly = true)
    public List<Farm> list(Long ownerId, Long workerId) {
        if (ownerId != null && workerId != null) {
            throw new BadRequestException("Use either ownerId or workerId, not both");
        }
        if (workerId != null) {
            return farmRepo.findByWorkerUserId(workerId);
        }
        if (ownerId != null) {
            return farmRepo.findByOwnerId(ownerId);
        }
        return farmRepo.findAll();
    }

    @Transactional(readOnly = true)
    public Farm get(Long id) {
        return farmRepo.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Farm not found with ID: " + id));
    }

    @Transactional
    public Farm update(Long id, FarmUpdateRequest req) {
        Farm farm = get(id);

        // Farm area cannot be reduced below the area already divided into plots
        BigDecimal plotted = plottedArea(id);
        if (req.totalAreaAcres().compareTo(plotted) < 0) {
            throw new BadRequestException(
                    "Farm area cannot be less than the area already divided into plots ("
                            + plotted.toPlainString() + " acres)");
        }

        String name = req.name().trim();
        if (farmRepo.existsByOwnerIdAndNameIgnoreCaseAndIdNot(farm.getOwnerId(), name, id)) {
            throw new BadRequestException(
                    "This owner already has a farm named '" + name + "'");
        }

        farm.setName(name);
        farm.setVillage(req.village());
        farm.setDistrict(req.district());
        farm.setState(req.state());
        farm.setLatitude(req.latitude());
        farm.setLongitude(req.longitude());
        farm.setTotalAreaAcres(req.totalAreaAcres());
        return farmRepo.save(farm);
    }

    @Transactional
    public void delete(Long id) {
        Farm farm = get(id);

        // children first, otherwise foreign keys block the delete
        soilTestRepo.deleteByPlot_Farm_Id(id);
        plotRepo.deleteByFarm_Id(id);
        workerRepo.deleteByFarm_Id(id);
        documentService.deleteAllForFarm(id);
        farmRepo.delete(farm);
    }

    @Transactional(readOnly = true)
    public long countPlots(Long farmId) {
        return plotRepo.countByFarm_Id(farmId);
    }

    @Transactional(readOnly = true)
    public List<Plot> getPlots(Long farmId) {
        return plotRepo.findByFarm_Id(farmId);
    }

    @Transactional(readOnly = true)
    public List<FarmWorker> getWorkers(Long farmId) {
        return workerRepo.findByFarm_Id(farmId);
    }

    @Transactional(readOnly = true)
    public FarmSummaryResponse summary(Long id) {
        Farm farm = get(id);

        List<Plot> plots = plotRepo.findByFarm_Id(id);
        BigDecimal plotted = plottedArea(id);
        BigDecimal total = farm.getTotalAreaAcres() == null
                ? BigDecimal.ZERO : farm.getTotalAreaAcres();
        BigDecimal unplotted = total.subtract(plotted).max(BigDecimal.ZERO);

        List<PlotWithSoil> plotRows = plots.stream()
                .map(p -> new PlotWithSoil(p,
                        soilTestRepo.findFirstByPlot_IdOrderByTestDateDescIdDesc(p.getId())
                                .orElse(null)))
                .toList();

        List<FarmWorker> assigned = workerRepo.findByFarm_Id(id);
        List<Long> workerIds = assigned.stream().map(FarmWorker::getUserId).toList();
        List<WorkerInfo> workers = assigned.stream()
                .map(w -> new WorkerInfo(
                        w.getUserId(),
                        userDirectory.displayName(w.getUserId()).orElse(null),
                        w.getAssignedAt()))
                .toList();

        long documentCount = documentRepo.countByFarm_Id(id);

        // placeholders for modules built by other team members
        Map<String, String> upcoming = new LinkedHashMap<>();
        upcoming.put("crops", "Coming soon");
        upcoming.put("irrigation", "Coming soon");
        upcoming.put("weather", "Coming soon");
        upcoming.put("gis", "Coming soon");

        return new FarmSummaryResponse(
                farm,
                plots.size(),
                plotted,
                unplotted,
                plotRows,
                workerIds,
                workers,
                documentCount,
                upcoming);
    }

    private BigDecimal plottedArea(Long farmId) {
        BigDecimal sum = plotRepo.sumAreaByFarmId(farmId);
        return sum == null ? BigDecimal.ZERO : sum;
    }
}
