package com.farmverse.farm.service;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.LandDocument;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.repository.FarmRepository;
import com.farmverse.farm.repository.LandDocumentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class LandDocumentService {

    private static final Set<String> ALLOWED = Set.of("pdf", "jpg", "jpeg", "png");
    private static final int MAX_DOC_TYPE_LENGTH = 100;

    private final LandDocumentRepository documentRepo;
    private final FarmRepository farmRepo;
    private final Path root;

    public LandDocumentService(LandDocumentRepository documentRepo,
                               FarmRepository farmRepo,
                               @Value("${app.upload-dir}") String uploadDir) {
        this.documentRepo = documentRepo;
        this.farmRepo = farmRepo;
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @Transactional
    public LandDocument upload(Long farmId, String docType, MultipartFile file) {
        Farm farm = farmRepo.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found with id " + farmId));
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please choose a file to upload");
        }
        if (docType != null && docType.length() > MAX_DOC_TYPE_LENGTH) {
            throw new BadRequestException("Document type is too long (max " + MAX_DOC_TYPE_LENGTH + " characters)");
        }

        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        original = original.substring(Math.max(original.lastIndexOf('/'), original.lastIndexOf('\\')) + 1);
        String ext = original.contains(".")
                ? original.substring(original.lastIndexOf('.') + 1).toLowerCase() : "";
        if (!ALLOWED.contains(ext)) {
            throw new BadRequestException("Only PDF, JPG and PNG files are allowed");
        }
        // the extension alone can be faked, so also check the real file signature
        if (!contentMatchesExtension(file, ext)) {
            throw new BadRequestException("File content does not match its ." + ext + " extension");
        }

        String storedName = UUID.randomUUID() + "_" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path target = null;
        try {
            Path dir = root.resolve("farm-" + farmId);
            Files.createDirectories(dir);
            target = dir.resolve(storedName);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }

            LandDocument doc = new LandDocument();
            doc.setFarm(farm);
            doc.setDocType(docType == null || docType.isBlank() ? null : docType.trim());
            doc.setFileName(original);
            doc.setFilePath(target.toString());
            return documentRepo.save(doc);
        } catch (IOException e) {
            throw new IllegalStateException("Could not store the file", e);
        } catch (RuntimeException e) {
            // do not leave an orphan file on disk when the database save fails
            if (target != null) {
                try {
                    Files.deleteIfExists(target);
                } catch (IOException ignored) {
                    // nothing more we can do
                }
            }
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<LandDocument> listByFarm(Long farmId) {
        if (!farmRepo.existsById(farmId)) {
            throw new ResourceNotFoundException("Farm not found with id " + farmId);
        }
        return documentRepo.findByFarm_Id(farmId);
    }

    @Transactional(readOnly = true)
    public LandDocument get(Long id) {
        return documentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id " + id));
    }

    public Resource load(LandDocument doc) {
        Resource res = new FileSystemResource(Path.of(doc.getFilePath()));
        if (!res.exists()) {
            throw new ResourceNotFoundException("File is missing on the server");
        }
        return res;
    }

    /** Correct content type for the download response, based on the stored file name. */
    public String contentType(LandDocument doc) {
        String name = doc.getFileName() == null ? "" : doc.getFileName().toLowerCase();
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    @Transactional
    public void delete(Long id) {
        LandDocument doc = get(id);
        deleteFileQuietly(doc);
        documentRepo.delete(doc);
    }

    @Transactional
    public void deleteAllForFarm(Long farmId) {
        List<LandDocument> docs = documentRepo.findByFarm_Id(farmId);
        docs.forEach(this::deleteFileQuietly);
        documentRepo.deleteAll(docs);
    }

    private boolean contentMatchesExtension(MultipartFile file, String ext) {
        byte[] h;
        try (InputStream in = file.getInputStream()) {
            h = in.readNBytes(8);
        } catch (IOException e) {
            throw new IllegalStateException("Could not read the uploaded file", e);
        }
        return switch (ext) {
            case "pdf" -> startsWith(h, 0x25, 0x50, 0x44, 0x46);                  // %PDF
            case "png" -> startsWith(h, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
            case "jpg", "jpeg" -> startsWith(h, 0xFF, 0xD8, 0xFF);
            default -> false;
        };
    }

    private static boolean startsWith(byte[] data, int... signature) {
        if (data.length < signature.length) return false;
        for (int i = 0; i < signature.length; i++) {
            if ((data[i] & 0xFF) != signature[i]) return false;
        }
        return true;
    }

    private void deleteFileQuietly(LandDocument doc) {
        try {
            Files.deleteIfExists(Path.of(doc.getFilePath()));
        } catch (IOException ignored) {
            // the database record is still removed
        }
    }
}
