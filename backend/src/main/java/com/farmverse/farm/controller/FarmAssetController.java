package com.farmverse.farm.controller;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.entity.FarmWorker;
import com.farmverse.farm.entity.LandDocument;
import com.farmverse.farm.security.FarmAccessService;
import com.farmverse.farm.service.FarmWorkerService;
import com.farmverse.farm.service.LandDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Worker assignment and land documents of a farm. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FarmAssetController {

    private final FarmWorkerService workerService;
    private final LandDocumentService documentService;
    private final FarmAccessService access;
    private final AuditService audit;

    // ---- Workers ----
    @PostMapping("/farms/{farmId}/workers/{userId}")
    @PreAuthorize("hasAuthority('FARM_ASSIGN')")
    public ResponseEntity<FarmWorker> assignWorker(@PathVariable Long farmId, @PathVariable Long userId) {
        requireCanAssign(farmId);
        FarmWorker worker = workerService.assign(farmId, userId);
        audit.log("ASSIGN_WORKER", "FARM", farmId, "user=" + userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(worker);
    }

    @DeleteMapping("/farms/{farmId}/workers/{userId}")
    @PreAuthorize("hasAuthority('FARM_ASSIGN')")
    public ResponseEntity<Void> unassignWorker(@PathVariable Long farmId, @PathVariable Long userId) {
        requireCanAssign(farmId);
        workerService.unassign(farmId, userId);
        audit.log("UNASSIGN_WORKER", "FARM", farmId, "user=" + userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/farms/{farmId}/workers")
    @PreAuthorize("hasAuthority('FARM_READ')")
    public List<FarmWorker> listWorkers(@PathVariable Long farmId) {
        access.requireAccess(farmId);
        return workerService.list(farmId);
    }

    // ---- Land documents ----
    /** multipart/form-data with fields: file, docType */
    @PostMapping(value = "/farms/{farmId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('FARM_WRITE')")
    public ResponseEntity<LandDocument> upload(@PathVariable Long farmId,
                                               @RequestParam(required = false) String docType,
                                               @RequestParam("file") MultipartFile file) {
        access.requireAccess(farmId);
        LandDocument doc = documentService.upload(farmId, docType, file);
        audit.log("UPLOAD", "DOCUMENT", doc.getId(), doc.getFileName());
        return ResponseEntity.status(HttpStatus.CREATED).body(doc);
    }

    @GetMapping("/farms/{farmId}/documents")
    @PreAuthorize("hasAuthority('FARM_READ')")
    public List<LandDocument> listDocuments(@PathVariable Long farmId) {
        access.requireAccess(farmId);
        return documentService.listByFarm(farmId);
    }

    @GetMapping("/documents/{id}/download")
    @PreAuthorize("hasAuthority('FARM_READ')")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        access.requireDocumentAccess(id);
        LandDocument doc = documentService.get(id);
        Resource file = documentService.load(doc);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(documentService.contentType(doc)))
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(doc.getFileName()).build().toString())
                .body(file);
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasAuthority('FARM_WRITE')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        access.requireDocumentAccess(id);
        documentService.delete(id);
        audit.log("DELETE", "DOCUMENT", id, null);
        return ResponseEntity.noContent().build();
    }

    private void requireCanAssign(Long farmId) {
        access.requireAccess(farmId);
        if (!access.canAssignStaff(farmId)) {
            throw new AccessDeniedException("Only the farm owner, an administrator or an assigned manager can assign staff");
        }
    }
}
