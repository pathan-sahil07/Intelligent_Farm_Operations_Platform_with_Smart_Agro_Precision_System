package com.farmverse.farm.service;

import com.farmverse.farm.entity.Farm;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Aggregates one farm's cross-module numbers (crops, irrigation, inventory, equipment, tasks). */
@Service
public class FarmDashboardService {
    private final NamedParameterJdbcTemplate jdbc;
    private final FarmService farmService;

    public FarmDashboardService(NamedParameterJdbcTemplate jdbc, FarmService farmService) {
        this.jdbc = jdbc;
        this.farmService = farmService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard(Long farmId) {
        Farm farm = farmService.get(farmId);
        MapSqlParameterSource p = new MapSqlParameterSource("farmId", farmId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("farm", farm);
        result.put("plotCount", farmService.countPlots(farmId));
        BigDecimal plotted = jdbc.queryForObject(
                "select coalesce(sum(area_acres),0) from plots where farm_id = :farmId", p, BigDecimal.class);
        result.put("plottedAcres", plotted);
        result.put("activeCrops", jdbc.queryForObject(
                "select count(*) from crops where farm_id = :farmId and status = 'Active'", p, Long.class));
        List<Map<String, Object>> harvests = jdbc.queryForList("""
                select id as "cropId", name, expected_harvest_date as "expectedHarvestDate"
                from crops
                where farm_id = :farmId and status = 'Active' and expected_harvest_date is not null
                  and expected_harvest_date between current_date and current_date + 14
                order by expected_harvest_date""", p);
        result.put("upcomingHarvests", harvests);
        result.put("pendingIrrigation", jdbc.queryForObject(
                "select count(*) from irrigation_schedules where farm_id = :farmId and status = 'Scheduled'", p, Long.class));
        result.put("lowStockItems", jdbc.queryForObject(
                "select count(*) from inventory_items where farm_id = :farmId and reorder_level > 0 and quantity <= reorder_level", p, Long.class));
        result.put("equipmentDueMaintenance", jdbc.queryForObject("""
                select count(*) from equipment
                where farm_id = :farmId and status <> 'RETIRED'
                  and next_maintenance_date is not null and next_maintenance_date <= current_date + 14""", p, Long.class));
        result.put("openTasks", jdbc.queryForObject(
                "select count(*) from tasks where farm_id = :farmId and status in ('OPEN','IN_PROGRESS')", p, Long.class));
        return result;
    }
}
