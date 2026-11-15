package com.farmverse.farm.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
public class AuditController {
    private final AuditLogRepository repository;

    public AuditController(AuditLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('AUDIT_READ')")
    public Page<AuditLog> list(@RequestParam(required = false) String entityType,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "25") int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return entityType == null || entityType.isBlank()
                ? repository.findAll(pageable)
                : repository.findByEntityType(entityType, pageable);
    }
}
