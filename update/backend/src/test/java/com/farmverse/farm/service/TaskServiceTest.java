package com.farmverse.farm.service;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.Task;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.notification.NotificationService;
import com.farmverse.farm.repository.*;
import com.farmverse.farm.security.AppUserPrincipal;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock TaskRepository tasks;
    @Mock LabourRecordRepository labour;
    @Mock FarmRepository farms;
    @Mock FarmWorkerRepository workers;
    @Mock UserRepository users;
    @Mock FarmAccessService access;
    @Mock AuditService audit;
    @Mock NotificationService notifications;
    TaskService service;

    @BeforeEach
    void setUp() {
        service = new TaskService(tasks, labour, farms, workers, users, access, audit, notifications);
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private void login(long id, String role, String... permissions) {
        AppUserPrincipal p = new AppUserPrincipal(id, "u@x.y", "U", role, true, Set.of(permissions));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities()));
    }

    private Task task(Long assignedTo) {
        Task t = new Task();
        t.setId(5L);
        t.setFarmId(9L);
        t.setTitle("Spray");
        t.setAssignedTo(assignedTo);
        t.setStatus("OPEN");
        return t;
    }

    @Test
    void creatingAssignedTaskNotifiesTheAssignee() {
        login(1, "FARM_OWNER", "TASK_WRITE");
        Farm farm = new Farm();
        farm.setId(9L);
        farm.setOwnerId(1L);
        when(users.existsById(7L)).thenReturn(true);
        when(farms.findById(9L)).thenReturn(Optional.of(farm));
        when(workers.existsByFarm_IdAndUserId(9L, 7L)).thenReturn(true);
        when(tasks.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));
        service.create(task(7L));
        verify(notifications).notifyUser(eq(7L), eq("TASK"), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void cannotAssignToSomeoneOutsideTheFarm() {
        login(1, "FARM_OWNER", "TASK_WRITE");
        Farm farm = new Farm();
        farm.setId(9L);
        farm.setOwnerId(1L);
        when(users.existsById(7L)).thenReturn(true);
        when(farms.findById(9L)).thenReturn(Optional.of(farm));
        when(workers.existsByFarm_IdAndUserId(9L, 7L)).thenReturn(false);
        assertThrows(BadRequestException.class, () -> service.create(task(7L)));
    }

    @Test
    void workerCanUpdateOnlyOwnTaskStatus() {
        login(7, "FIELD_WORKER", "TASK_UPDATE");
        when(tasks.findById(5L)).thenReturn(Optional.of(task(7L)));
        when(tasks.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));
        assertEquals("DONE", service.updateStatus(5L, "DONE").getStatus());

        when(tasks.findById(6L)).thenReturn(Optional.of(task(8L)));
        assertThrows(AccessDeniedException.class, () -> service.updateStatus(6L, "DONE"));
    }

    @Test
    void invalidStatusRejected() {
        login(1, "FARM_OWNER", "TASK_WRITE");
        assertThrows(BadRequestException.class, () -> service.updateStatus(5L, "WHATEVER"));
    }
}
