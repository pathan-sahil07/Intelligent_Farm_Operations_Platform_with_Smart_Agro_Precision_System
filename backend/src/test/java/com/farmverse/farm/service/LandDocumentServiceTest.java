package com.farmverse.farm.service;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.LandDocument;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.repository.FarmRepository;
import com.farmverse.farm.repository.LandDocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LandDocumentServiceTest {

    @Mock LandDocumentRepository documentRepo;
    @Mock FarmRepository farmRepo;
    @TempDir Path tempDir;

    LandDocumentService service;

    @BeforeEach
    void setUp() {
        service = new LandDocumentService(documentRepo, farmRepo, tempDir.toString());
        Farm farm = new Farm();
        farm.setId(1L);
        lenient().when(farmRepo.findById(1L)).thenReturn(Optional.of(farm));
    }

    @Test
    void rejectsDisallowedExtension() {
        MockMultipartFile file = new MockMultipartFile("file", "virus.exe",
                "application/octet-stream", "MZ".getBytes(StandardCharsets.UTF_8));

        assertThrows(BadRequestException.class, () -> service.upload(1L, "deed", file));
    }

    @Test
    void rejectsFileWhoseContentIsNotAPdf() {
        MockMultipartFile fake = new MockMultipartFile("file", "deed.pdf",
                "application/pdf", "MZ-this-is-not-a-pdf".getBytes(StandardCharsets.UTF_8));

        assertThrows(BadRequestException.class, () -> service.upload(1L, "deed", fake));
    }

    @Test
    void acceptsRealPdfAndStoresIt() {
        MockMultipartFile pdf = new MockMultipartFile("file", "deed.pdf",
                "application/pdf", "%PDF-1.4 sample".getBytes(StandardCharsets.UTF_8));
        when(documentRepo.save(any(LandDocument.class))).thenAnswer(i -> i.getArgument(0));

        LandDocument doc = service.upload(1L, "sale deed", pdf);

        assertEquals("deed.pdf", doc.getFileName());
        assertEquals("sale deed", doc.getDocType());
        assertTrue(Files.exists(Path.of(doc.getFilePath())));
        assertEquals("application/pdf", service.contentType(doc));
    }
}
