package com.samsung.merchandising_api.controller;

import com.samsung.merchandising_api.dto.*;
import com.samsung.merchandising_api.model.Assignment;
import com.samsung.merchandising_api.model.Store;
import com.samsung.merchandising_api.model.User;
import com.samsung.merchandising_api.model.Visit;
import com.samsung.merchandising_api.model.VisitStatus;
import com.samsung.merchandising_api.repository.AssignmentRepository;
import com.samsung.merchandising_api.repository.InteractionRepository;
import com.samsung.merchandising_api.repository.SelloutRepository;
import com.samsung.merchandising_api.repository.StoreRepository;
import com.samsung.merchandising_api.repository.UserRepository;
import com.samsung.merchandising_api.repository.VisitRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/visits")
@CrossOrigin("*")
public class VisitController {

    /** Maximum allowed distance (in meters) between check-in position and store coordinates */
    private static final double GEOFENCE_RADIUS_METERS = 500.0;

    private final VisitRepository visitRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final InteractionRepository interactionRepository;
    private final SelloutRepository selloutRepository;

    public VisitController(VisitRepository visitRepository,
                           StoreRepository storeRepository,
                           UserRepository userRepository,
                           AssignmentRepository assignmentRepository,
                           InteractionRepository interactionRepository,
                           SelloutRepository selloutRepository) {
        this.visitRepository = visitRepository;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.interactionRepository = interactionRepository;
        this.selloutRepository = selloutRepository;
    }

    /**
     * Calculate distance between two GPS coordinates using the Haversine formula.
     * @return distance in meters
     */
    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /** Enrich a VisitResponseDTO with interaction and sellout details */
    private VisitResponseDTO enrichWithDetails(VisitResponseDTO dto) {
        if (dto.getId() != null) {
            dto.setInteractions(
                interactionRepository.findByVisitId(dto.getId()).stream()
                    .map(InteractionDTO::fromEntity)
                    .collect(Collectors.toList())
            );
            dto.setSelloutItems(
                selloutRepository.findByVisitId(dto.getId()).stream()
                    .map(SelloutDTO::fromEntity)
                    .collect(Collectors.toList())
            );
        }
        return dto;
    }

    /**
     * GET /api/visits - Retourne toutes les visites, triées par date (plus récentes en premier)
     * Inclut les informations du magasin et de l'utilisateur
     */
    @GetMapping
    public List<VisitResponseDTO> getAllVisits() {
        return visitRepository.findAllByVisitDateDescNative().stream()
                .map(VisitResponseDTO::fromVisit)
                .map(this::enrichWithDetails)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/visits/{id} - Retourne une visite par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Visit> getVisitById(@PathVariable Long id) {
        return visitRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/visits/stats - Retourne les KPIs agrégés
     * - totalVisits: Nombre de visites COMPLETED
     * - totalSales: Somme des salesAmount
     * - avgShelfShare: Moyenne des shelfShare
     */
    @GetMapping("/stats")
    public VisitStatsDTO getVisitStats() {
        Long totalVisits = visitRepository.countCompletedVisits();
        Double totalSales = visitRepository.sumTotalSales();
        Double avgShelfShare = visitRepository.avgShelfShare();

        return new VisitStatsDTO(totalVisits, totalSales, avgShelfShare);
    }

    /**
     * GET /api/visits/user/{userId} - Retourne les visites d'un utilisateur (DTO enrichi)
     */
    @GetMapping("/user/{userId}")
    public List<VisitResponseDTO> getVisitsByUser(@PathVariable Long userId) {
        return visitRepository.findByUserId(userId).stream()
                .map(VisitResponseDTO::fromVisit)
                .map(this::enrichWithDetails)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/visits/store/{storeId} - Retourne les visites d'un magasin
     */
    @GetMapping("/store/{storeId}")
    public List<Visit> getVisitsByStore(@PathVariable Long storeId) {
        return visitRepository.findByStoreId(storeId);
    }

    /**
     * POST /api/visits/submit - Soumet une nouvelle visite
     * Reçoit: { storeId, userId, shelfShare, comment, checkInLatitude, checkInLongitude }
     * Crée une visite COMPLETED avec la date actuelle.
     * Includes geofencing validation: warns if user is beyond GEOFENCE_RADIUS_METERS from the store.
     */
    @PostMapping("/submit")
    public ResponseEntity<?> submitVisit(@RequestBody VisitSubmitDTO dto) {
        // Trouver le Store
        Store store = storeRepository.findById(dto.getStoreId())
                .orElse(null);
        if (store == null) {
            return ResponseEntity.badRequest().build();
        }

        // Trouver le User
        User user = userRepository.findById(dto.getUserId())
                .orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }

        // ── Geofencing validation ──
        Double distanceMeters = null;
        boolean outsideGeofence = false;
        if (dto.getCheckInLatitude() != null && dto.getCheckInLongitude() != null
                && store.getLatitude() != null && store.getLongitude() != null) {
            distanceMeters = haversineDistance(
                    dto.getCheckInLatitude(), dto.getCheckInLongitude(),
                    store.getLatitude(), store.getLongitude());
            outsideGeofence = distanceMeters > GEOFENCE_RADIUS_METERS;
        }

        // Créer la visite (we allow it even if outside geofence, but flag it)
        Visit visit = new Visit();
        visit.setStore(store);
        visit.setUser(user);
        LocalDateTime now = LocalDateTime.now();
        visit.setVisitDate(now);
        visit.setShelfShare(dto.getShelfShare());

        // Append geofence warning to comment if outside radius
        String finalComment = dto.getComment() != null ? dto.getComment() : "";
        if (outsideGeofence && distanceMeters != null) {
            finalComment += String.format("\n⚠️ Géorepérage: %.0f m du magasin (rayon autorisé: %.0f m)", distanceMeters, GEOFENCE_RADIUS_METERS);
        }
        visit.setComment(finalComment);
        visit.setStatus(VisitStatus.COMPLETED);

        // Lier une affectation si fournie
        if (dto.getAssignmentId() != null) {
            Assignment assignment = assignmentRepository.findById(dto.getAssignmentId())
                    .orElse(null);
            if (assignment != null) {
                visit.setAssignment(assignment);
                // Marquer les temps de check-in / check-out sur l'affectation
                if (assignment.getCheckInTime() == null) {
                    assignment.setCheckInTime(now);
                }
                assignment.setCheckOutTime(now);
                assignmentRepository.save(assignment);
            }
        }

        visit.setCheckInLatitude(dto.getCheckInLatitude());
        visit.setCheckInLongitude(dto.getCheckInLongitude());

        // Sauvegarder
        Visit savedVisit = visitRepository.save(visit);

        // Build response with geofence info
        Map<String, Object> response = new HashMap<>();
        response.put("visit", savedVisit);
        if (distanceMeters != null) {
            response.put("distanceToStore", Math.round(distanceMeters));
            response.put("geofenceRadius", (int) GEOFENCE_RADIUS_METERS);
            response.put("outsideGeofence", outsideGeofence);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/visits - Crée une nouvelle visite (rapport de Promoter)
     * Reçoit: { userId, storeId, shelfShare, comment }
     * Crée une visite COMPLETED avec la date actuelle
     */
    @PostMapping
    public Visit createVisit(@RequestBody VisitRequest request) {
        // Trouver le Store (lance exception si non trouvé)
        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new NoSuchElementException("Store non trouvé avec l'ID: " + request.getStoreId()));

        // Trouver le User (lance exception si non trouvé)
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new NoSuchElementException("User non trouvé avec l'ID: " + request.getUserId()));

        // Créer la visite
        Visit visit = new Visit();
        visit.setStore(store);
        visit.setUser(user);
        visit.setVisitDate(LocalDateTime.now());
        visit.setShelfShare(request.getShelfShare());
        visit.setComment(request.getComment());
        visit.setStatus(VisitStatus.COMPLETED);

        // Lier une affectation si fournie
        if (request.getAssignmentId() != null) {
            Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                    .orElse(null);
            if (assignment != null) {
                visit.setAssignment(assignment);
            }
        }

        visit.setCheckInLatitude(request.getCheckInLatitude());
        visit.setCheckInLongitude(request.getCheckInLongitude());

        // Sauvegarder et retourner
        return visitRepository.save(visit);
    }

    /**
     * PATCH /api/visits/{id}/status - Met à jour le statut d'une visite
     * Utilisé par le Superviseur pour valider ou rejeter une visite
     * @param id ID de la visite
     * @param status Nouveau statut (VALIDATED ou REJECTED)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Visit> updateVisitStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        
        // Trouver la visite
        Visit visit = visitRepository.findById(id)
                .orElse(null);
        
        if (visit == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Valider et mettre à jour le statut
        try {
            VisitStatus newStatus = VisitStatus.valueOf(status.toUpperCase());
            visit.setStatus(newStatus);
            Visit updatedVisit = visitRepository.save(visit);
            return ResponseEntity.ok(updatedVisit);
        } catch (IllegalArgumentException e) {
            // Statut invalide
            return ResponseEntity.badRequest().build();
        }
    }
}
