package com.farmverse.farm.service;

import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.security.FarmAccessService;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/** Read-only aggregates. Every query is limited to farms the caller can access (and the optional farmId/date filter). */
@Service
public class AnalyticsService {
    private final NamedParameterJdbcTemplate jdbc;
    private final FarmAccessService access;

    public AnalyticsService(NamedParameterJdbcTemplate jdbc, FarmAccessService access) {
        this.jdbc = jdbc;
        this.access = access;
    }

    private MapSqlParameterSource params(Long farmId, LocalDate from, LocalDate to) {
        return new MapSqlParameterSource()
                .addValue("ids", access.scope(farmId).ids())
                .addValue("from", from == null ? LocalDate.of(1970, 1, 1) : from)
                .addValue("to", to == null ? LocalDate.of(2999, 1, 1) : to);
    }

    private long count(String sql, MapSqlParameterSource p) {
        Long v = jdbc.queryForObject(sql, p, Long.class);
        return v == null ? 0 : v;
    }

    private BigDecimal sum(String sql, MapSqlParameterSource p) {
        BigDecimal v = jdbc.queryForObject(sql, p, BigDecimal.class);
        return v == null ? BigDecimal.ZERO : v;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> overview(Long farmId, LocalDate from, LocalDate to) {
        MapSqlParameterSource p = params(farmId, from, to);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("totalFarms", count("select count(*) from farms where id in (:ids)", p));
        r.put("totalPlots", count("select count(*) from plots where farm_id in (:ids)", p));
        r.put("activeCrops", count("select count(*) from crops where farm_id in (:ids) and status = 'Active'", p));
        r.put("harvestRecords", count("select count(*) from harvest_records where farm_id in (:ids) and harvest_date between :from and :to", p));
        r.put("irrigationSchedules", count("select count(*) from irrigation_schedules where farm_id in (:ids) and scheduled_date between :from and :to", p));
        r.put("inventoryItems", count("select count(*) from inventory_items where farm_id in (:ids)", p));
        r.put("totalHarvestKg", sum("select sum(quantity_kg) from harvest_records where farm_id in (:ids) and harvest_date between :from and :to", p));
        r.put("completedIrrigation", count("select count(*) from irrigation_schedules where farm_id in (:ids) and status = 'Completed' and scheduled_date between :from and :to", p));
        r.put("totalWaterLiters", sum("select sum(water_liters) from irrigation_schedules where farm_id in (:ids) and status = 'Completed' and scheduled_date between :from and :to", p));
        r.put("operationalCost", costsTotal(p));
        r.put("lowStockCount", count("select count(*) from inventory_items where farm_id in (:ids) and reorder_level > 0 and quantity <= reorder_level", p));
        r.put("openTasks", count("select count(*) from tasks where farm_id in (:ids) and status in ('OPEN','IN_PROGRESS')", p));
        return r;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> production(Long farmId, LocalDate from, LocalDate to) {
        MapSqlParameterSource p = params(farmId, from, to);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("byCrop", jdbc.queryForList("""
                select crop_name as "crop", sum(quantity_kg) as "quantityKg", count(*) as "records"
                from harvest_records where farm_id in (:ids) and harvest_date between :from and :to
                group by crop_name order by sum(quantity_kg) desc""", p));
        r.put("byMonth", jdbc.queryForList("""
                select to_char(harvest_date, 'YYYY-MM') as "month", sum(quantity_kg) as "quantityKg"
                from harvest_records where farm_id in (:ids) and harvest_date between :from and :to
                group by 1 order by 1""", p));
        return r;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> irrigation(Long farmId, LocalDate from, LocalDate to) {
        MapSqlParameterSource p = params(farmId, from, to);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("byDay", jdbc.queryForList("""
                select to_char(scheduled_date, 'YYYY-MM-DD') as "date", sum(water_liters) as "liters"
                from irrigation_schedules where farm_id in (:ids) and status = 'Completed'
                  and scheduled_date between :from and :to group by scheduled_date order by scheduled_date""", p));
        r.put("byCrop", jdbc.queryForList("""
                select c.name as "crop", sum(s.water_liters) as "liters"
                from irrigation_schedules s join crops c on c.id = s.crop_id
                where s.farm_id in (:ids) and s.status = 'Completed' and s.scheduled_date between :from and :to
                group by c.name order by sum(s.water_liters) desc""", p));
        Map<String, Object> statusCounts = new LinkedHashMap<>(Map.of("Scheduled", 0L, "Completed", 0L, "Skipped", 0L));
        jdbc.query("""
                select status, count(*) as n from irrigation_schedules
                where farm_id in (:ids) and scheduled_date between :from and :to group by status""", p,
                rs -> { statusCounts.put(rs.getString("status"), rs.getLong("n")); });
        r.put("statusCounts", statusCounts);
        return r;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> inventory(Long farmId, LocalDate from, LocalDate to) {
        MapSqlParameterSource p = params(farmId, from, to);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("byCategory", jdbc.queryForList("""
                select category as "category", count(*) as "itemCount",
                       coalesce(sum(quantity * coalesce(unit_cost, 0)), 0) as "stockValue"
                from inventory_items where farm_id in (:ids) group by category order by category""", p));
        r.put("lowStock", jdbc.queryForList("""
                select id as "id", name as "name", quantity as "quantity", reorder_level as "reorderLevel", unit as "unit"
                from inventory_items where farm_id in (:ids) and reorder_level > 0 and quantity <= reorder_level
                order by name""", p));
        r.put("consumptionByMonth", jdbc.queryForList("""
                select to_char(t.created_at, 'YYYY-MM') as "month", sum(t.quantity) as "quantity"
                from inventory_transactions t join inventory_items i on i.id = t.inventory_item_id
                where i.farm_id in (:ids) and t.transaction_type = 'CONSUMPTION'
                  and t.created_at::date between :from and :to group by 1 order by 1""", p));
        return r;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> equipment(Long farmId, LocalDate from, LocalDate to) {
        MapSqlParameterSource p = params(farmId, from, to);
        return Map.of("items", jdbc.queryForList("""
                select e.id as "id", e.name as "name", e.category as "category", e.status as "status",
                       e.operating_hours as "operatingHours",
                       coalesce((select sum(m.cost) from equipment_maintenance m
                                 where m.equipment_id = e.id and m.completed_date is not null
                                   and m.completed_date between :from and :to), 0) as "maintenanceCost"
                from equipment e where e.farm_id in (:ids) order by e.name""", p));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> resources(Long farmId, LocalDate from, LocalDate to) {
        MapSqlParameterSource p = params(farmId, from, to);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("byCategory", jdbc.queryForList("""
                select category as "category", sum(planned_quantity) as "planned",
                       sum(consumed_quantity) as "consumed", sum(cost) as "cost"
                from resources where farm_id in (:ids) group by category order by category""", p));
        r.put("labourHours", sum("select sum(hours) from labour_records where farm_id in (:ids) and work_date between :from and :to", p));
        r.put("labourCost", sum("select sum(hours * hourly_rate) from labour_records where farm_id in (:ids) and work_date between :from and :to", p));
        return r;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> costs(Long farmId, LocalDate from, LocalDate to) {
        MapSqlParameterSource p = params(farmId, from, to);
        List<Map<String, Object>> rows = costRows(p);
        BigDecimal total = rows.stream().map(m -> (BigDecimal) m.get("amount")).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("byCategory", rows);
        r.put("total", total);
        return r;
    }

    private BigDecimal costsTotal(MapSqlParameterSource p) {
        return costRows(p).stream().map(m -> (BigDecimal) m.get("amount")).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<Map<String, Object>> costRows(MapSqlParameterSource p) {
        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(cost("Resources", sum("select sum(cost) from resources where farm_id in (:ids)", p)));
        rows.add(cost("Maintenance", sum("""
                select sum(m.cost) from equipment_maintenance m join equipment e on e.id = m.equipment_id
                where e.farm_id in (:ids) and m.completed_date between :from and :to""", p)));
        rows.add(cost("Inventory purchases", sum("""
                select sum(t.quantity * coalesce(t.unit_cost, 0)) from inventory_transactions t
                join inventory_items i on i.id = t.inventory_item_id
                where i.farm_id in (:ids) and t.transaction_type = 'PURCHASE' and t.created_at::date between :from and :to""", p)));
        rows.add(cost("Labour", sum("select sum(hours * hourly_rate) from labour_records where farm_id in (:ids) and work_date between :from and :to", p)));
        rows.add(cost("Tasks", sum("select sum(actual_cost) from tasks where farm_id in (:ids) and status = 'DONE'", p)));
        return rows;
    }

    private static Map<String, Object> cost(String category, BigDecimal amount) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("category", category);
        m.put("amount", amount);
        return m;
    }

    /** CSV text for one report. */
    @SuppressWarnings("unchecked")
    @Transactional(readOnly = true)
    public String exportCsv(String report, Long farmId, LocalDate from, LocalDate to) {
        List<Map<String, Object>> rows;
        switch (report == null ? "" : report) {
            case "production" -> rows = (List<Map<String, Object>>) production(farmId, from, to).get("byCrop");
            case "irrigation" -> rows = (List<Map<String, Object>>) irrigation(farmId, from, to).get("byDay");
            case "inventory" -> rows = (List<Map<String, Object>>) inventory(farmId, from, to).get("byCategory");
            case "equipment" -> rows = (List<Map<String, Object>>) equipment(farmId, from, to).get("items");
            case "resources" -> rows = (List<Map<String, Object>>) resources(farmId, from, to).get("byCategory");
            case "costs" -> rows = (List<Map<String, Object>>) costs(farmId, from, to).get("byCategory");
            default -> throw new BadRequestException("report must be one of production, irrigation, inventory, equipment, resources, costs");
        }
        return toCsv(rows);
    }

    static String toCsv(List<Map<String, Object>> rows) {
        if (rows.isEmpty()) return "\r\n";
        StringBuilder sb = new StringBuilder();
        List<String> headers = new ArrayList<>(rows.get(0).keySet());
        sb.append(String.join(",", headers.stream().map(AnalyticsService::escape).toList())).append("\r\n");
        for (Map<String, Object> row : rows) {
            List<String> cells = new ArrayList<>();
            for (String h : headers) cells.add(escape(row.get(h) == null ? "" : String.valueOf(row.get(h))));
            sb.append(String.join(",", cells)).append("\r\n");
        }
        return sb.toString();
    }

    /** RFC 4180 quoting plus protection against spreadsheet formula injection. */
    static String escape(String value) {
        String v = value;
        if (!v.isEmpty() && "=+-@\t\r".indexOf(v.charAt(0)) >= 0 && !isNumber(v)) {
            v = "'" + v;
        }
        if (v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r")) {
            return "\"" + v.replace("\"", "\"\"") + "\"";
        }
        return v;
    }

    private static boolean isNumber(String v) {
        try {
            new BigDecimal(v);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
