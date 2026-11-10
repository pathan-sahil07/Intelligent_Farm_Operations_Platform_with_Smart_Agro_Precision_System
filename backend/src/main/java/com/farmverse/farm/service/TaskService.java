package com.farmverse.farm.service;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.LabourRecord;
import com.farmverse.farm.entity.Task;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.notification.NotificationService;
import com.farmverse.farm.repository.*;
import com.farmverse.farm.security.AppUserPrincipal;
import com.farmverse.farm.security.CurrentUser;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class TaskService {
    public static final Set<String> STATUSES = Set.of("OPEN", "IN_PROGRESS", "DONE", "CANCELLED");

    private final TaskRepository tasks;
    private final LabourRecordRepository labour;
    private final FarmRepository farms;
    private final FarmWorkerRepository workers;
    private final UserRepository users;
    private final FarmAccessService access;
    private final AuditService audit;
    private final NotificationService notifications;

    public TaskService(TaskRepository tasks, LabourRecordRepository labour, FarmRepository farms,
                       FarmWorkerRepository workers, UserRepository users, FarmAccessService access,
                       AuditService audit, NotificationService notifications) {
        this.tasks = tasks;
        this.labour = labour;
        this.farms = farms;
        this.workers = workers;
        this.users = users;
        this.access = access;
        this.audit = audit;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public Page<Task> list(Long farmId, String status, Long assignedTo, Pageable pageable) {
        FarmAccessService.Scope scope = access.scope(farmId);
        Page<Task> page = tasks.search(scope.ids(), status == null || status.isBlank() ? "%" : status,
                assignedTo == null ? 0L : assignedTo, pageable);
        page.forEach(this::decorate);
        return page;
    }

    @Transactional
    public Task create(Task body) {
        access.requireAccess(body.getFarmId());
        validate(body);
        body.setId(null);
        body.setStatus("OPEN");
        body.setCreatedBy(CurrentUser.get().getId());
        Task saved = tasks.save(body);
        audit.log("CREATE", "TASK", saved.getId(), saved.getTitle());
        notifyAssignee(saved);
        return decorate(saved);
    }

    @Transactional
    public Task update(Long id, Task body) {
        Task task = load(id);
        Long previousAssignee = task.getAssignedTo();
        body.setFarmId(task.getFarmId());
        validate(body);
        task.setTitle(body.getTitle());
        task.setDescription(body.getDescription());
        task.setTaskType(body.getTaskType());
        task.setAssignedTo(body.getAssignedTo());
        task.setPlotId(body.getPlotId());
        task.setCropId(body.getCropId());
        task.setEquipmentId(body.getEquipmentId());
        task.setDueDate(body.getDueDate());
        task.setEstimatedCost(body.getEstimatedCost());
        task.setActualCost(body.getActualCost());
        Task saved = tasks.save(task);
        audit.log("UPDATE", "TASK", id, saved.getTitle());
        if (saved.getAssignedTo() != null && !saved.getAssignedTo().equals(previousAssignee)) notifyAssignee(saved);
        return decorate(saved);
    }

    @Transactional
    public Task updateStatus(Long id, String status) {
        if (!STATUSES.contains(status)) throw new BadRequestException("status must be one of " + STATUSES);
        Task task = load(id);
        AppUserPrincipal user = CurrentUser.get();
        boolean canManage = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("TASK_WRITE"));
        if (!canManage && !user.getId().equals(task.getAssignedTo())) {
            throw new AccessDeniedException("You can only update tasks assigned to you");
        }
        task.setStatus(status);
        audit.log("STATUS", "TASK", id, status);
        return decorate(tasks.save(task));
    }

    @Transactional
    public void delete(Long id) {
        Task task = load(id);
        tasks.delete(task);
        audit.log("DELETE", "TASK", id, task.getTitle());
    }

    // ---- labour ----
    @Transactional(readOnly = true)
    public List<LabourRecord> listLabour(Long farmId, LocalDate from, LocalDate to) {
        List<LabourRecord> list = labour.search(access.scope(farmId).ids(),
                from == null ? LocalDate.of(1970, 1, 1) : from, to == null ? LocalDate.of(2999, 1, 1) : to);
        list.forEach(l -> l.setUserName(users.findById(l.getUserId()).map(u -> u.getFullName()).orElse(null)));
        return list;
    }

    @Transactional
    public LabourRecord addLabour(LabourRecord body) {
        access.requireAccess(body.getFarmId());
        requireParticipant(body.getFarmId(), body.getUserId());
        body.setId(null);
        LabourRecord saved = labour.save(body);
        audit.log("CREATE", "LABOUR", saved.getId(), saved.getHours() + "h");
        saved.setUserName(users.findById(saved.getUserId()).map(u -> u.getFullName()).orElse(null));
        return saved;
    }

    @Transactional
    public void deleteLabour(Long id) {
        LabourRecord l = labour.findById(id).orElseThrow(() -> new ResourceNotFoundException("Labour record not found"));
        access.requireAccess(l.getFarmId());
        labour.delete(l);
        audit.log("DELETE", "LABOUR", id, null);
    }

    private Task load(Long id) {
        Task task = tasks.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        access.requireAccess(task.getFarmId());
        return task;
    }

    private void validate(Task t) {
        if (t.getAssignedTo() != null) requireParticipant(t.getFarmId(), t.getAssignedTo());
    }

    /** A person can only be given work on a farm they own or are assigned to. */
    private void requireParticipant(Long farmId, Long userId) {
        if (userId == null || !users.existsById(userId)) throw new BadRequestException("Unknown user");
        Farm farm = farms.findById(farmId).orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        if (!userId.equals(farm.getOwnerId()) && !workers.existsByFarm_IdAndUserId(farmId, userId)) {
            throw new BadRequestException("User " + userId + " is not assigned to this farm");
        }
    }

    private void notifyAssignee(Task t) {
        if (t.getAssignedTo() == null) return;
        notifications.notifyUser(t.getAssignedTo(), "TASK", "New task: " + t.getTitle(),
                t.getDueDate() == null ? "A task was assigned to you." : "Due " + t.getDueDate() + ".",
                "/resources", "task-assigned:" + t.getId() + ":" + t.getAssignedTo());
    }

    private Task decorate(Task t) {
        if (t.getAssignedTo() != null) {
            t.setAssignedToName(users.findById(t.getAssignedTo()).map(u -> u.getFullName()).orElse(null));
        }
        return t;
    }
}
