package com.samsung.merchandising_api.controller;

import com.samsung.merchandising_api.dto.VisitStatsDTO;
import com.samsung.merchandising_api.dto.VisitSubmitDTO;
import com.samsung.merchandising_api.dto.VisitRequest;
import com.samsung.merchandising_api.dto.VisitResponseDTO;
import com.samsung.merchandising_api.model.Assignment;
import com.samsung.merchandising_api.model.Store;
import com.samsung.merchandising_api.model.User;
import com.samsung.merchandising_api.model.Visit;
import com.samsung.merchandising_api.model.VisitStatus;
import com.samsung.merchandising_api.repository.AssignmentRepository;
import com.samsung.merchandising_api.repository.StoreRepository;
import com.samsung.merchandising_api.repository.UserRepository;
import com.samsung.merchandising_api.repository.VisitRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/visits")
@CrossOrigin("*")
public class VisitController {

    private final VisitRepository visitRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;

    public VisitController(VisitRepository visitRepository,
                           StoreRepository storeRepository,
                           UserRepository userRepository,
                           AssignmentRepository assignmentRepository) {
        this.visitRepository = visitRepository;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
    }

    /**
     * GET /api/visits - Retourne toutes les visites, triées par date (plus récentes en premier)
     * Inclut les informations du magasin et de l'utilisateur
     */
    @GetMapping
    public List<VisitResponseDTO> getAllVisits() {
        return visitRepository.findAllByVisitDateDescNative().stream()
                .map(VisitResponseDTO::fromVisit)
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
     * GET /api/visits/user/{userId} - Retourne les visites d'un utilisateur
     */
    @GetMapping("/user/{userId}")
    public List<Visit> getVisitsByUser(@PathVariable Long userId) {
        return visitRepository.findByUserId(userId);
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
     * Reçoit: { storeId, userId, shelfShare, comment }
     * Crée une visite COMPLETED avec la date actuelle
     */
    @PostMapping("/submit")
    public ResponseEntity<Visit> submitVisit(@RequestBody VisitSubmitDTO dto) {
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

        // Créer la visite
        Visit visit = new Visit();
        visit.setStore(store);
        visit.setUser(user);
        visit.setVisitDate(LocalDateTime.now());
        visit.setShelfShare(dto.getShelfShare());
        visit.setComment(dto.getComment());
        visit.setStatus(VisitStatus.COMPLETED);

        // Lier une affectation si fournie
        if (dto.getAssignmentId() != null) {
            Assignment assignment = assignmentRepository.findById(dto.getAssignmentId())
                    .orElse(null);
            if (assignment != null) {
                visit.setAssignment(assignment);
            }
        }

        visit.setCheckInLatitude(dto.getCheckInLatitude());
        visit.setCheckInLongitude(dto.getCheckInLongitude());

        // Sauvegarder et retourner
        Visit savedVisit = visitRepository.save(visit);
        return ResponseEntity.ok(savedVisit);
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
