package com.farmverse.farm.controller;

import com.farmverse.farm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    private final FarmRepository farms;
    private final PlotRepository plots;
    private final CropRepository crops;
    private final HarvestRecordRepository harvests;
    private final IrrigationScheduleRepository irrigation;
    private final InventoryItemRepository inventory;

    @GetMapping("/overview")
    public Map<String, Object> overview() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalFarms", farms.count());
        result.put("totalPlots", plots.count());
        result.put("activeCrops", crops.countByStatus("Active"));
        result.put("harvestRecords", harvests.count());
        result.put("irrigationSchedules", irrigation.count());
        result.put("inventoryItems", inventory.count());
        result.put("totalHarvestKg", harvests.totalQuantityKg().orElse(BigDecimal.ZERO));
        result.put("completedIrrigation", irrigation.countByStatus("Completed"));
        return result;
    }
}
