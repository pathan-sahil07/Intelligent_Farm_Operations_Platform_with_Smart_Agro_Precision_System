package com.farmverse.farm.service;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AnalyticsServiceTest {
    @Test
    void escapesCommasQuotesAndNewlines() {
        assertEquals("plain", AnalyticsService.escape("plain"));
        assertEquals("\"a,b\"", AnalyticsService.escape("a,b"));
        assertEquals("\"say \"\"hi\"\"\"", AnalyticsService.escape("say \"hi\""));
        assertEquals("\"line1\nline2\"", AnalyticsService.escape("line1\nline2"));
    }

    @Test
    void neutralisesSpreadsheetFormulas() {
        assertEquals("'=SUM(A1)", AnalyticsService.escape("=SUM(A1)"));
        assertEquals("'@cmd", AnalyticsService.escape("@cmd"));
        assertEquals("-5.5", AnalyticsService.escape("-5.5"), "negative numbers stay numeric");
    }

    @Test
    void buildsCsvWithHeaderAndNulls() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("crop", "Wheat, durum");
        row.put("quantityKg", 120.5);
        row.put("note", null);
        assertEquals("crop,quantityKg,note\r\n\"Wheat, durum\",120.5,\r\n", AnalyticsService.toCsv(List.of(row)));
    }
}
