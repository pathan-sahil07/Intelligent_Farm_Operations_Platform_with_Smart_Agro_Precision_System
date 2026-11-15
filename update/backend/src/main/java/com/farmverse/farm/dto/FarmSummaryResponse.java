package com.farmverse.farm.dto;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.Plot;
import com.farmverse.farm.entity.SoilTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Data for the farm summary page. */
public record FarmSummaryResponse(
        Farm farm,
        long plotCount,
        BigDecimal plottedAreaAcres,
        BigDecimal unplottedAreaAcres,
        List<PlotWithSoil> plots,
        List<Long> assignedWorkerIds,
        List<WorkerInfo> workers,
        long documentCount,
        Map<String, String> upcomingModules) {

    /** A plot together with its most recent soil test (null if none yet). */
    public record PlotWithSoil(Plot plot, SoilTest latestSoilTest) {
    }

    /** name is null until Module 1 provides user names. */
    public record WorkerInfo(Long userId, String name, LocalDateTime assignedAt) {
    }
}
