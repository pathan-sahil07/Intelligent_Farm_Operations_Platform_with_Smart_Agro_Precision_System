package com.farmverse.farm.controller;

import com.farmverse.farm.entity.FarmWorker;
import com.farmverse.farm.entity.LandDocument;
import com.farmverse.farm.service.FarmWorkerService;
import com.farmverse.farm.service.LandDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    // ---- Workers ----
    @PostMapping("/farms/{farmId}/workers/{userId}")
    public ResponseEntity<FarmWorker> assignWorker(@PathVariable Long farmId, @PathVariable Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workerService.assign(farmId, userId));
    }

    @DeleteMapping("/farms/{farmId}/workers/{userId}")
    public ResponseEntity<Void> unassignWorker(@PathVariable Long farmId, @PathVariable Long userId) {
        workerService.unassign(farmId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/farms/{farmId}/workers")
    public List<FarmWorker> listWorkers(@PathVariable Long farmId) {
        return workerService.list(farmId);
    }

    // ---- Land documents ----
    /** multipart/form-data with fields: file, docType */
    @PostMapping(value = "/farms/{farmId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LandDocument> upload(@PathVariable Long farmId,
                                               @RequestParam(required = false) String docType,
                                               @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.upload(farmId, docType, file));
    }

    @GetMapping("/farms/{farmId}/documents")
    public List<LandDocument> listDocuments(@PathVariable Long farmId) {
        return documentService.listByFarm(farmId);
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
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
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
