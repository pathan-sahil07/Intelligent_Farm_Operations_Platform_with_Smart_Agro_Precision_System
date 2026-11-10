package com.farmverse.farm.audit;

import com.farmverse.farm.security.AppUserPrincipal;
import com.farmverse.farm.security.CurrentUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Records who did what. Never breaks the business operation if writing the audit row fails. */
@Service
public class AuditService {
    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityType, Long entityId, String details) {
        try {
            AuditLog entry = new AuditLog();
            CurrentUser.find().ifPresent((AppUserPrincipal p) -> {
                entry.setUserId(p.getId());
                entry.setUserEmail(p.getEmail());
            });
            entry.setAction(action);
            entry.setEntityType(entityType);
            entry.setEntityId(entityId);
            entry.setDetails(details != null && details.length() > 1000 ? details.substring(0, 1000) : details);
            repository.save(entry);
        } catch (RuntimeException e) {
            log.warn("Could not write audit entry {} {}: {}", action, entityType, e.getMessage());
        }
    }
}
