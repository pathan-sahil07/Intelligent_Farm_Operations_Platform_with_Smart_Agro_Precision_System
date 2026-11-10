package com.farmverse.farm.service;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.Equipment;
import com.farmverse.farm.entity.EquipmentMaintenance;
import com.farmverse.farm.entity.EquipmentUsage;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ConflictException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.EquipmentMaintenanceRepository;
import com.farmverse.farm.repository.EquipmentRepository;
import com.farmverse.farm.repository.EquipmentUsageRepository;
import com.farmverse.farm.security.CurrentUser;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.user.UserRepository;
import jakarta.validation.constraints.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class EquipmentService {
    public static final Set<String> STATUSES = Set.of("AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED");
    static final Set<String> MAINTENANCE_TYPES = Set.of("SERVICE", "REPAIR", "INSPECTION");

    public record AllocateRequest(Long userId, Long taskId) {
    }

    public record HoursRequest(@NotNull @Positive @DecimalMax("24") BigDecimal hours, @NotNull LocalDate usageDate,
                               String notes) {
    }

    public record CompleteRequest(@NotNull LocalDate completedDate, @PositiveOrZero BigDecimal cost) {
    }

    private final EquipmentRepository equipment;
    private final EquipmentMaintenanceRepository maintenance;
    private final EquipmentUsageRepository usage;
    private final UserRepository users;
    private final FarmAccessService access;
    private final AuditService audit;

    public EquipmentService(EquipmentRepository equipment, EquipmentMaintenanceRepository maintenance,
                            EquipmentUsageRepository usage, UserRepository users, FarmAccessService access,
                            AuditService audit) {
        this.equipment = equipment;
        this.maintenance = maintenance;
        this.usage = usage;
        this.users = users;
        this.access = access;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<Equipment> list(Long farmId, String status, String category) {
        FarmAccessService.Scope scope = access.scope(farmId);
        return equipment.search(scope.ids(), scope.legacy(), blank(status), blank(category));
    }

    @Transactional
    public Equipment create(Equipment body) {
        if (body.getFarmId() == null) throw new BadRequestException("farmId is required");
        access.requireAccess(body.getFarmId());
        if (!STATUSES.contains(body.getStatus())) throw new BadRequestException("status must be one of " + STATUSES);
        body.setId(null);
        body.setOperatingHours(BigDecimal.ZERO);
        body.setAllocatedToUserId(null);
        body.setAllocatedToTaskId(null);
        Equipment saved = equipment.save(body);
        audit.log("CREATE", "EQUIPMENT", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public Equipment update(Long id, Equipment body) {
        Equipment e = load(id);
        if (!STATUSES.contains(body.getStatus())) throw new BadRequestException("status must be one of " + STATUSES);
        e.setName(body.getName());
        e.setCategory(body.getCategory());
        e.setIdentifier(body.getIdentifier());
        e.setStatus(body.getStatus());
        e.setPurchaseDate(body.getPurchaseDate());
        e.setPurchaseCost(body.getPurchaseCost());
        if (!"IN_USE".equals(e.getStatus())) {
            e.setAllocatedToUserId(null);
            e.setAllocatedToTaskId(null);
        }
        audit.log("UPDATE", "EQUIPMENT", id, e.getName());
        return equipment.save(e);
    }

    @Transactional
    public void delete(Long id) {
        Equipment e = load(id);
        equipment.delete(e);
        audit.log("DELETE", "EQUIPMENT", id, e.getName());
    }

    @Transactional
    public Equipment allocate(Long id, AllocateRequest req) {
        Equipment e = load(id);
        if (req.userId() == null && req.taskId() == null) throw new BadRequestException("userId or taskId is required");
        if (!"AVAILABLE".equals(e.getStatus())) {
            throw new ConflictException("Equipment is not available (status " + e.getStatus() + ")");
        }
        if (req.userId() != null && !users.existsById(req.userId())) throw new BadRequestException("Unknown user");
        e.setStatus("IN_USE");
        e.setAllocatedToUserId(req.userId());
        e.setAllocatedToTaskId(req.taskId());
        audit.log("ALLOCATE", "EQUIPMENT", id, "user=" + req.userId() + " task=" + req.taskId());
        return equipment.save(e);
    }

    @Transactional
    public Equipment release(Long id) {
        Equipment e = load(id);
        if (!"IN_USE".equals(e.getStatus())) throw new ConflictException("Equipment is not currently allocated");
        e.setStatus("AVAILABLE");
        e.setAllocatedToUserId(null);
        e.setAllocatedToTaskId(null);
        audit.log("RELEASE", "EQUIPMENT", id, null);
        return equipment.save(e);
    }

    @Transactional
    public Equipment logHours(Long id, HoursRequest req) {
        Equipment e = load(id);
        if ("RETIRED".equals(e.getStatus())) throw new ConflictException("Retired equipment cannot be used");
        EquipmentUsage u = new EquipmentUsage();
        u.setEquipmentId(id);
        u.setUsageDate(req.usageDate());
        u.setHours(req.hours());
        u.setNotes(req.notes());
        u.setRecordedBy(CurrentUser.find().map(p -> p.getId()).orElse(null));
        usage.save(u);
        e.setOperatingHours(e.getOperatingHours().add(req.hours()));
        audit.log("HOURS", "EQUIPMENT", id, req.hours().toPlainString());
        return equipment.save(e);
    }

    @Transactional(readOnly = true)
    public List<EquipmentMaintenance> history(Long id) {
        load(id);
        return maintenance.findByEquipment_IdOrderByScheduledDateDesc(id);
    }

    @Transactional
    public EquipmentMaintenance scheduleMaintenance(Long id, EquipmentMaintenance body) {
        Equipment e = load(id);
        if (!MAINTENANCE_TYPES.contains(body.getMaintenanceType())) {
            throw new BadRequestException("maintenanceType must be one of " + MAINTENANCE_TYPES);
        }
        body.setId(null);
        body.setEquipment(e);
        body.setCompletedDate(null);
        EquipmentMaintenance saved = maintenance.save(body);
        refreshNextMaintenance(e);
        audit.log("SCHEDULE_MAINTENANCE", "EQUIPMENT", id, saved.getMaintenanceType() + " " + saved.getScheduledDate());
        return saved;
    }

    @Transactional
    public EquipmentMaintenance completeMaintenance(Long maintenanceId, CompleteRequest req) {
        EquipmentMaintenance m = maintenance.findById(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance record not found"));
        Equipment e = load(m.getEquipment().getId());
        if (m.getCompletedDate() != null) throw new ConflictException("Maintenance is already completed");
        m.setCompletedDate(req.completedDate());
        if (req.cost() != null) m.setCost(req.cost());
        EquipmentMaintenance saved = maintenance.save(m);
        refreshNextMaintenance(e);
        audit.log("COMPLETE_MAINTENANCE", "EQUIPMENT", e.getId(), String.valueOf(maintenanceId));
        return saved;
    }

    @Transactional(readOnly = true)
    public List<EquipmentMaintenance> due(Long farmId, int days) {
        return maintenance.due(access.scope(farmId).ids(), LocalDate.now().plusDays(Math.max(days, 0)));
    }

    private void refreshNextMaintenance(Equipment e) {
        LocalDate next = maintenance.findByEquipment_IdAndCompletedDateIsNullOrderByScheduledDateAsc(e.getId()).stream()
                .map(EquipmentMaintenance::getScheduledDate).findFirst().orElse(null);
        e.setNextMaintenanceDate(next);
        equipment.save(e);
    }

    Equipment load(Long id) {
        Equipment e = equipment.findById(id).orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));
        access.requireFarmOrLegacy(e.getFarmId());
        return e;
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? "%" : s;
    }
}
