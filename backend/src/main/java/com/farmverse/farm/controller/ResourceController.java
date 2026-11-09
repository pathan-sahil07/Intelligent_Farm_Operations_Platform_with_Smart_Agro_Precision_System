package com.farmverse.farm.controller;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.FarmResource;
import com.farmverse.farm.entity.LabourRecord;
import com.farmverse.farm.entity.Task;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.FarmResourceRepository;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.service.TaskService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/** Module 4: resources, utilization, tasks and labour. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ResourceController {
    private final FarmResourceRepository resources;
    private final TaskService taskService;
    private final FarmAccessService access;
    private final AuditService audit;

    public record StatusRequest(@NotBlank String status) {
    }

    // ---- resources ----
    @GetMapping("/resources")
    @PreAuthorize("hasAuthority('RESOURCE_READ')")
    public List<FarmResource> list(@RequestParam(required = false) Long farmId) {
        FarmAccessService.Scope scope = access.scope(farmId);
        return resources.search(scope.ids(), scope.legacy());
    }

    @PostMapping("/resources")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('RESOURCE_WRITE')")
    public FarmResource create(@Valid @RequestBody FarmResource resource) {
        if (resource.getFarmId() == null) throw new BadRequestException("farmId is required");
        access.requireAccess(resource.getFarmId());
        resource.setId(null);
        FarmResource saved = resources.save(resource);
        audit.log("CREATE", "RESOURCE", saved.getId(), saved.getName());
        return saved;
    }

    @PutMapping("/resources/{id}")
    @PreAuthorize("hasAuthority('RESOURCE_WRITE')")
    public FarmResource update(@PathVariable Long id, @Valid @RequestBody FarmResource body) {
        FarmResource r = load(id);
        if (body.getConsumedQuantity().compareTo(body.getPlannedQuantity()) > 0) {
            throw new BadRequestException("Consumed quantity cannot exceed planned quantity");
        }
        r.setName(body.getName());
        r.setCategory(body.getCategory());
        r.setUnit(body.getUnit());
        r.setPlannedQuantity(body.getPlannedQuantity());
        r.setConsumedQuantity(body.getConsumedQuantity());
        r.setCost(body.getCost());
        r.setSeason(body.getSeason());
        audit.log("UPDATE", "RESOURCE", id, r.getName());
        return resources.save(r);
    }

    @DeleteMapping("/resources/{id}")
    @PreAuthorize("hasAuthority('RESOURCE_WRITE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        FarmResource r = load(id);
        resources.delete(r);
        audit.log("DELETE", "RESOURCE", id, r.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/resources/{id}/consume")
    @Transactional
    @PreAuthorize("hasAuthority('RESOURCE_WRITE')")
    public FarmResource consume(@PathVariable Long id, @RequestParam BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) throw new BadRequestException("quantity must be positive");
        FarmResource resource = load(id);
        BigDecimal remaining = resource.getPlannedQuantity().subtract(resource.getConsumedQuantity());
        if (remaining.compareTo(quantity) < 0) throw new BadRequestException("Consumption exceeds planned quantity");
        resource.setConsumedQuantity(resource.getConsumedQuantity().add(quantity));
        audit.log("CONSUME", "RESOURCE", id, quantity.toPlainString());
        return resources.save(resource);
    }

    @GetMapping("/resources/utilization")
    @PreAuthorize("hasAuthority('RESOURCE_READ')")
    public List<Map<String, Object>> utilization(@RequestParam(required = false) Long farmId) {
        FarmAccessService.Scope scope = access.scope(farmId);
        Map<String, BigDecimal[]> byCategory = new TreeMap<>();
        for (FarmResource r : resources.search(scope.ids(), scope.legacy())) {
            BigDecimal[] sums = byCategory.computeIfAbsent(r.getCategory(),
                    k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
            sums[0] = sums[0].add(r.getPlannedQuantity());
            sums[1] = sums[1].add(r.getConsumedQuantity());
            sums[2] = sums[2].add(r.getCost());
        }
        List<Map<String, Object>> out = new ArrayList<>();
        byCategory.forEach((category, s) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("category", category);
            row.put("planned", s[0]);
            row.put("consumed", s[1]);
            row.put("utilizationPercent", s[0].signum() == 0 ? BigDecimal.ZERO
                    : s[1].multiply(BigDecimal.valueOf(100)).divide(s[0], 1, RoundingMode.HALF_UP));
            row.put("cost", s[2]);
            out.add(row);
        });
        return out;
    }

    // ---- tasks ----
    @GetMapping("/tasks")
    @PreAuthorize("hasAuthority('TASK_READ')")
    public Page<Task> tasks(@RequestParam(required = false) Long farmId, @RequestParam(required = false) String status,
                            @RequestParam(required = false) Long assignedTo,
                            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return taskService.list(farmId, status, assignedTo,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by("dueDate").ascending().and(Sort.by("id").descending())));
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('TASK_WRITE')")
    public Task createTask(@Valid @RequestBody Task task) {
        return taskService.create(task);
    }

    @PutMapping("/tasks/{id}")
    @PreAuthorize("hasAuthority('TASK_WRITE')")
    public Task updateTask(@PathVariable Long id, @Valid @RequestBody Task task) {
        return taskService.update(id, task);
    }

    @PatchMapping("/tasks/{id}/status")
    @PreAuthorize("hasAnyAuthority('TASK_WRITE','TASK_UPDATE')")
    public Task taskStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return taskService.updateStatus(id, request.status());
    }

    @DeleteMapping("/tasks/{id}")
    @PreAuthorize("hasAuthority('TASK_WRITE')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---- labour ----
    @GetMapping("/labour")
    @PreAuthorize("hasAuthority('RESOURCE_READ')")
    public List<LabourRecord> labour(@RequestParam(required = false) Long farmId,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return taskService.listLabour(farmId, from, to);
    }

    @PostMapping("/labour")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('RESOURCE_WRITE')")
    public LabourRecord addLabour(@Valid @RequestBody LabourRecord record) {
        return taskService.addLabour(record);
    }

    @DeleteMapping("/labour/{id}")
    @PreAuthorize("hasAuthority('RESOURCE_WRITE')")
    public ResponseEntity<Void> deleteLabour(@PathVariable Long id) {
        taskService.deleteLabour(id);
        return ResponseEntity.noContent().build();
    }

    private FarmResource load(Long id) {
        FarmResource r = resources.findById(id).orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        access.requireFarmOrLegacy(r.getFarmId());
        return r;
    }
}
