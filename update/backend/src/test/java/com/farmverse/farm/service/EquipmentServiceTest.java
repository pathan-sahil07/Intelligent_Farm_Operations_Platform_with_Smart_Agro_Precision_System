package com.farmverse.farm.service;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.Equipment;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ConflictException;
import com.farmverse.farm.repository.*;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.service.EquipmentService.*;
import com.farmverse.farm.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {
    @Mock EquipmentRepository equipment;
    @Mock EquipmentMaintenanceRepository maintenance;
    @Mock EquipmentUsageRepository usage;
    @Mock UserRepository users;
    @Mock FarmAccessService access;
    @Mock AuditService audit;
    EquipmentService service;
    Equipment tractor;

    @BeforeEach
    void setUp() {
        service = new EquipmentService(equipment, maintenance, usage, users, access, audit);
        tractor = new Equipment();
        tractor.setId(1L);
        tractor.setFarmId(9L);
        tractor.setName("Tractor");
        tractor.setStatus("AVAILABLE");
        lenient().when(equipment.findById(1L)).thenReturn(Optional.of(tractor));
        lenient().when(equipment.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void allocatingAnAvailableMachineMarksItInUse() {
        when(users.existsById(4L)).thenReturn(true);
        Equipment e = service.allocate(1L, new AllocateRequest(4L, null));
        assertEquals("IN_USE", e.getStatus());
        assertEquals(4L, e.getAllocatedToUserId());
    }

    @Test
    void allocatingTwiceConflicts() {
        tractor.setStatus("IN_USE");
        assertThrows(ConflictException.class, () -> service.allocate(1L, new AllocateRequest(4L, null)));
    }

    @Test
    void allocationNeedsUserOrTask() {
        assertThrows(BadRequestException.class, () -> service.allocate(1L, new AllocateRequest(null, null)));
    }

    @Test
    void releaseClearsAllocation() {
        tractor.setStatus("IN_USE");
        tractor.setAllocatedToUserId(4L);
        Equipment e = service.release(1L);
        assertEquals("AVAILABLE", e.getStatus());
        assertNull(e.getAllocatedToUserId());
    }

    @Test
    void loggedHoursAccumulate() {
        service.logHours(1L, new HoursRequest(new BigDecimal("2.5"), LocalDate.now(), null));
        service.logHours(1L, new HoursRequest(new BigDecimal("1.5"), LocalDate.now(), null));
        assertEquals(0, new BigDecimal("4.0").compareTo(tractor.getOperatingHours()));
    }

    @Test
    void retiredEquipmentCannotLogHours() {
        tractor.setStatus("RETIRED");
        assertThrows(ConflictException.class,
                () -> service.logHours(1L, new HoursRequest(BigDecimal.ONE, LocalDate.now(), null)));
    }
}
