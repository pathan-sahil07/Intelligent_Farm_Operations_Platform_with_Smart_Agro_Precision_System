package com.farmverse.farm.service;

import com.farmverse.farm.entity.Crop;
import com.farmverse.farm.entity.IrrigationSchedule;
import com.farmverse.farm.exception.ConflictException;
import com.farmverse.farm.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IrrigationServiceTest {
    @Mock IrrigationScheduleRepository schedules;

    private Crop crop(long id) {
        Crop c = new Crop();
        c.setId(id);
        c.setName("Wheat");
        c.setPlotId(7L);
        return c;
    }

    private WeatherService.Day day(Double rain, Double prob, Double tmax) {
        return new WeatherService.Day("2026-11-09", tmax, 15.0, rain, prob, 10.0);
    }

    @Test
    void skipsWhenRainIsExpected() {
        var r = IrrigationService.recommend(crop(1), day(8.0, 40.0, 28.0), null, null);
        assertEquals("SKIP", r.recommendation());
        r = IrrigationService.recommend(crop(1), day(0.0, 80.0, 28.0), null, null);
        assertEquals("SKIP", r.recommendation());
    }

    @Test
    void skipsWhenSoilAlreadyWet() {
        assertEquals("SKIP", IrrigationService.recommend(crop(1), day(0.0, 0.0, 28.0), null, 75.0).recommendation());
    }

    @Test
    void delaysBeforeHeavyRainTomorrow() {
        assertEquals("DELAY", IrrigationService.recommend(crop(1), day(0.0, 10.0, 28.0), day(12.0, 80.0, 25.0), null).recommendation());
    }

    @Test
    void irrigatesWhenDrySoilOrHot() {
        assertEquals("IRRIGATE", IrrigationService.recommend(crop(1), day(0.0, 10.0, 28.0), null, 20.0).recommendation());
        assertEquals("IRRIGATE", IrrigationService.recommend(crop(1), day(0.0, 10.0, 37.0), null, null).recommendation());
        assertEquals("IRRIGATE", IrrigationService.recommend(crop(1), day(0.0, 10.0, 24.0), null, null).recommendation());
    }

    @Test
    void timeWindowRule() {
        assertTrue(IrrigationService.closeInTime(LocalTime.of(6, 0), LocalTime.of(6, 59)));
        assertFalse(IrrigationService.closeInTime(LocalTime.of(6, 0), LocalTime.of(7, 0)));
        assertTrue(IrrigationService.closeInTime(null, null));
        assertFalse(IrrigationService.closeInTime(null, LocalTime.of(6, 0)));
    }

    private IrrigationSchedule schedule(Long id, long cropId, Long plotId, LocalTime time, String status) {
        IrrigationSchedule s = new IrrigationSchedule();
        s.setId(id);
        s.setFarmId(1L);
        s.setCrop(crop(cropId));
        s.setPlotId(plotId);
        s.setScheduledDate(LocalDate.of(2026, 11, 9));
        s.setScheduledTime(time);
        s.setStatus(status);
        return s;
    }

    private IrrigationService service() {
        return new IrrigationService(schedules, null, null, null, null, null, null, null);
    }

    @Test
    void sameCropWithinWindowConflicts() {
        when(schedules.findByFarmIdAndScheduledDate(1L, LocalDate.of(2026, 11, 9)))
                .thenReturn(List.of(schedule(10L, 1, 7L, LocalTime.of(6, 0), "Scheduled")));
        assertThrows(ConflictException.class, () -> service().checkConflict(schedule(null, 1, 7L, LocalTime.of(6, 30), "Scheduled"), null));
    }

    @Test
    void samePlotDifferentCropConflicts() {
        when(schedules.findByFarmIdAndScheduledDate(1L, LocalDate.of(2026, 11, 9)))
                .thenReturn(List.of(schedule(10L, 2, 7L, LocalTime.of(6, 0), "Scheduled")));
        assertThrows(ConflictException.class, () -> service().checkConflict(schedule(null, 1, 7L, LocalTime.of(6, 10), "Scheduled"), null));
    }

    @Test
    void skippedOrFarApartOrSelfDoNotConflict() {
        when(schedules.findByFarmIdAndScheduledDate(1L, LocalDate.of(2026, 11, 9))).thenReturn(List.of(
                schedule(10L, 1, 7L, LocalTime.of(6, 0), "Skipped"),
                schedule(11L, 1, 7L, LocalTime.of(18, 0), "Scheduled"),
                schedule(12L, 1, 7L, LocalTime.of(6, 20), "Scheduled")));
        assertDoesNotThrow(() -> service().checkConflict(schedule(12L, 1, 7L, LocalTime.of(6, 20), "Scheduled"), 12L));
    }
}
