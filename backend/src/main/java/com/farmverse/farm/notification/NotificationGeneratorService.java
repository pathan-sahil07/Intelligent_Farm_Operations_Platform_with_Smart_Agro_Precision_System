package com.farmverse.farm.notification;

import com.farmverse.farm.entity.Crop;
import com.farmverse.farm.entity.IrrigationSchedule;
import com.farmverse.farm.entity.Task;
import com.farmverse.farm.repository.CropRepository;
import com.farmverse.farm.repository.IrrigationScheduleRepository;
import com.farmverse.farm.repository.TaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/** Creates deduplicated notifications for irrigation, harvests, low stock, maintenance and overdue tasks. */
@Service
public class NotificationGeneratorService {
    private static final Logger log = LoggerFactory.getLogger(NotificationGeneratorService.class);

    private final NotificationService notifications;
    private final CropRepository crops;
    private final IrrigationScheduleRepository irrigation;
    private final TaskRepository tasks;
    private final NamedParameterJdbcTemplate jdbc;

    public NotificationGeneratorService(NotificationService notifications, CropRepository crops,
                                        IrrigationScheduleRepository irrigation, TaskRepository tasks,
                                        NamedParameterJdbcTemplate jdbc) {
        this.notifications = notifications;
        this.crops = crops;
        this.irrigation = irrigation;
        this.tasks = tasks;
        this.jdbc = jdbc;
    }

    /** Daily job (cron configurable via NOTIFICATIONS_CRON). Covers every farm. */
    @Scheduled(cron = "${notifications.cron:0 0 6 * * *}")
    public void scheduledRun() {
        try {
            generate(null);
        } catch (RuntimeException e) {
            log.warn("Notification generation failed: {}", e.getMessage());
        }
    }

    /** @param farmIds limit to these farms, or null for all. */
    public int generate(Set<Long> farmIds) {
        int before = 0;
        LocalDate today = LocalDate.now();
        for (IrrigationSchedule s : irrigation.findByScheduledDateAndStatus(today, "Scheduled")) {
            if (s.getFarmId() != null && inScope(farmIds, s.getFarmId())) {
                notifications.notifyFarm(s.getFarmId(), "IRRIGATION", "Irrigation due today: " + s.getCrop().getName(),
                        s.getWaterLiters().toPlainString() + " L" + (s.getScheduledTime() == null ? "" : " at " + s.getScheduledTime()) + ".",
                        "/irrigation", "irrigation:" + s.getId() + ":" + today);
                before++;
            }
        }
        for (Crop c : crops.findByStatusAndExpectedHarvestDateBetween("Active", today, today.plusDays(7))) {
            if (c.getFarmId() != null && inScope(farmIds, c.getFarmId())) {
                notifications.notifyFarm(c.getFarmId(), "HARVEST", "Harvest due soon: " + c.getName(),
                        "Expected on " + c.getExpectedHarvestDate() + ".", "/crops", "harvest:" + c.getId() + ":" + c.getExpectedHarvestDate());
                before++;
            }
        }
        List<java.util.Map<String, Object>> low = jdbc.queryForList(
                "select id, farm_id, name, quantity, unit from inventory_items where farm_id is not null and reorder_level > 0 and quantity <= reorder_level",
                new MapSqlParameterSource());
        for (var row : low) {
            Long farmId = ((Number) row.get("farm_id")).longValue();
            if (!inScope(farmIds, farmId)) continue;
            notifications.notifyFarm(farmId, "LOW_STOCK", "Low stock: " + row.get("name"),
                    row.get("name") + " is at " + row.get("quantity") + " " + row.get("unit") + ".", "/inventory",
                    "low-stock:" + row.get("id") + ":" + today);
            before++;
        }
        List<java.util.Map<String, Object>> due = jdbc.queryForList("""
                select m.id, e.farm_id, e.name, m.maintenance_type, m.scheduled_date
                from equipment_maintenance m join equipment e on e.id = m.equipment_id
                where e.farm_id is not null and m.completed_date is null and m.scheduled_date <= :until""",
                new MapSqlParameterSource("until", today.plusDays(7)));
        for (var row : due) {
            Long farmId = ((Number) row.get("farm_id")).longValue();
            if (!inScope(farmIds, farmId)) continue;
            notifications.notifyFarm(farmId, "MAINTENANCE", "Maintenance due: " + row.get("name"),
                    row.get("maintenance_type") + " scheduled for " + row.get("scheduled_date") + ".", "/equipment",
                    "maintenance:" + row.get("id"));
            before++;
        }
        for (Task t : tasks.findByStatusInAndDueDateBefore(List.of("OPEN", "IN_PROGRESS"), today)) {
            if (t.getAssignedTo() != null && inScope(farmIds, t.getFarmId())) {
                notifications.notifyUser(t.getAssignedTo(), "TASK", "Overdue task: " + t.getTitle(),
                        "Was due " + t.getDueDate() + ".", "/resources", "task-overdue:" + t.getId() + ":" + today);
                before++;
            }
        }
        return before;
    }

    private static boolean inScope(Set<Long> farmIds, Long farmId) {
        return farmIds == null || farmIds.contains(farmId);
    }
}
