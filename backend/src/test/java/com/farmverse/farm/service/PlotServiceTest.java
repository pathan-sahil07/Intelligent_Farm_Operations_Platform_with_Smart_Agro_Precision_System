package com.farmverse.farm.service;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.Plot;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.repository.FarmRepository;
import com.farmverse.farm.repository.PlotRepository;
import com.farmverse.farm.repository.SoilTestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlotServiceTest {

    @Mock PlotRepository plotRepo;
    @Mock FarmRepository farmRepo;
    @Mock SoilTestRepository soilTestRepo;
    @InjectMocks PlotService service;

    private Farm farm(String area) {
        Farm f = new Farm();
        f.setId(1L);
        f.setName("Green Valley");
        f.setOwnerId(1L);
        f.setTotalAreaAcres(new BigDecimal(area));
        return f;
    }

    private Plot plot(String name, String area) {
        Plot p = new Plot();
        p.setName(name);
        p.setAreaAcres(new BigDecimal(area));
        return p;
    }

    @Test
    void createRejectsPlotThatExceedsFarmArea() {
        when(farmRepo.findById(1L)).thenReturn(Optional.of(farm("10")));
        when(plotRepo.sumAreaByFarmId(1L)).thenReturn(new BigDecimal("8"));

        assertThrows(BadRequestException.class, () -> service.create(1L, plot("North", "3")));
    }

    @Test
    void createRejectsDuplicateNameInSameFarm() {
        when(farmRepo.findById(1L)).thenReturn(Optional.of(farm("10")));
        when(plotRepo.existsByFarm_IdAndNameIgnoreCase(1L, "North")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.create(1L, plot("  North ", "2")));
        assertEquals("A plot named 'North' already exists in this farm", ex.getMessage());
    }

    @Test
    void createSavesPlotThatFits() {
        when(farmRepo.findById(1L)).thenReturn(Optional.of(farm("10")));
        when(plotRepo.sumAreaByFarmId(1L)).thenReturn(new BigDecimal("4"));
        when(plotRepo.save(any(Plot.class))).thenAnswer(i -> i.getArgument(0));

        Plot saved = service.create(1L, plot("North", "6"));

        assertEquals("North", saved.getName());
        assertEquals(1L, saved.getFarmId());
    }
}
