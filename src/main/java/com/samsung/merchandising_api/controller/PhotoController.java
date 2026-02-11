package com.samsung.merchandising_api.controller;

import com.samsung.merchandising_api.model.Visit;
import com.samsung.merchandising_api.repository.VisitRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/photos")
@CrossOrigin("*")
public class PhotoController {

    private final VisitRepository visitRepository;

    /** Root folder where visit photos are persisted on disk. */
    private static final String UPLOAD_DIR = "uploads/photos";

    public PhotoController(VisitRepository visitRepository) {
        this.visitRepository = visitRepository;
    }

    /**
     * POST /api/photos/upload?visitId={visitId}
     * Receives a multipart file (photo) and links it to the given visit.
     *
     * @param file    the photo file (JPEG/PNG)
     * @param visitId the visit to attach the photo to
     * @return JSON with the public URL of the stored photo
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @RequestParam("file") MultipartFile file,
            @RequestParam("visitId") Long visitId) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        // Validate visit exists
        Visit visit = visitRepository.findById(visitId).orElse(null);
        if (visit == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Visite introuvable"));
        }

        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique file name
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            } else {
                // Default to .jpg for camera images
                extension = ".jpg";
            }
            String uniqueName = "visit-" + visitId + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;

            // Save the file
            Path filePath = uploadPath.resolve(uniqueName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Build the public URL (relative to the server root)
            String photoUrl = "/uploads/photos/" + uniqueName;

            // Update visit with photo URL
            visit.setPhotoUrl(photoUrl);
            visitRepository.save(visit);

            Map<String, String> result = new HashMap<>();
            result.put("photoUrl", photoUrl);
            result.put("fileName", uniqueName);
            return ResponseEntity.ok(result);

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erreur lors de l'enregistrement du fichier: " + e.getMessage()));
        }
    }
}
