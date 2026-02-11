package com.samsung.merchandising_api.controller;

import com.samsung.merchandising_api.dto.InteractionCreateDTO;
import com.samsung.merchandising_api.dto.InteractionDTO;
import com.samsung.merchandising_api.model.Interaction;
import com.samsung.merchandising_api.model.Product;
import com.samsung.merchandising_api.model.Visit;
import com.samsung.merchandising_api.repository.InteractionRepository;
import com.samsung.merchandising_api.repository.ProductRepository;
import com.samsung.merchandising_api.repository.VisitRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/visits/{visitId}/interactions")
@CrossOrigin(origins = "*")
public class InteractionController {

    private final InteractionRepository interactionRepository;
    private final VisitRepository visitRepository;
    private final ProductRepository productRepository;

    public InteractionController(InteractionRepository interactionRepository,
                                  VisitRepository visitRepository,
                                  ProductRepository productRepository) {
        this.interactionRepository = interactionRepository;
        this.visitRepository = visitRepository;
        this.productRepository = productRepository;
    }

    /**
     * GET /api/visits/{visitId}/interactions - Get all interactions for a visit
     */
    @GetMapping
    public ResponseEntity<?> getInteractionsByVisit(@PathVariable Long visitId) {
        if (!visitRepository.existsById(visitId)) {
            return ResponseEntity.notFound().build();
        }
        List<InteractionDTO> interactions = interactionRepository.findByVisitId(visitId)
                .stream()
                .map(InteractionDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(interactions);
    }

    /**
     * POST /api/visits/{visitId}/interactions - Add a single interaction to a visit
     */
    @PostMapping
    public ResponseEntity<?> addInteraction(@PathVariable Long visitId,
                                             @RequestBody InteractionCreateDTO dto) {
        Visit visit = visitRepository.findById(visitId).orElse(null);
        if (visit == null) {
            return ResponseEntity.notFound().build();
        }

        Interaction interaction = new Interaction();
        interaction.setVisit(visit);
        interaction.setGender(dto.getGender());
        interaction.setColor(dto.getColor());
        interaction.setCreatedAt(LocalDateTime.now());

        if (dto.getProductId() != null) {
            Product product = productRepository.findById(dto.getProductId()).orElse(null);
            interaction.setProduct(product);
        }

        Interaction saved = interactionRepository.save(interaction);

        // Update the interaction count on the Visit
        Long count = interactionRepository.countByVisitId(visitId);
        visit.setInteractionCount(count.intValue());
        visitRepository.save(visit);

        return ResponseEntity.status(HttpStatus.CREATED).body(InteractionDTO.fromEntity(saved));
    }

    /**
     * POST /api/visits/{visitId}/interactions/batch - Add multiple interactions at once
     */
    @PostMapping("/batch")
    public ResponseEntity<?> addInteractionsBatch(@PathVariable Long visitId,
                                                    @RequestBody List<InteractionCreateDTO> dtos) {
        Visit visit = visitRepository.findById(visitId).orElse(null);
        if (visit == null) {
            return ResponseEntity.notFound().build();
        }

        List<InteractionDTO> results = new ArrayList<>();
        for (InteractionCreateDTO dto : dtos) {
            Interaction interaction = new Interaction();
            interaction.setVisit(visit);
            interaction.setGender(dto.getGender());
            interaction.setColor(dto.getColor());
            interaction.setCreatedAt(LocalDateTime.now());

            if (dto.getProductId() != null) {
                Product product = productRepository.findById(dto.getProductId()).orElse(null);
                interaction.setProduct(product);
            }

            Interaction saved = interactionRepository.save(interaction);
            results.add(InteractionDTO.fromEntity(saved));
        }

        // Update the interaction count on the Visit
        Long count = interactionRepository.countByVisitId(visitId);
        visit.setInteractionCount(count.intValue());
        visitRepository.save(visit);

        return ResponseEntity.status(HttpStatus.CREATED).body(results);
    }

    /**
     * DELETE /api/visits/{visitId}/interactions/{interactionId} - Delete an interaction
     */
    @DeleteMapping("/{interactionId}")
    public ResponseEntity<?> deleteInteraction(@PathVariable Long visitId,
                                                @PathVariable Long interactionId) {
        Interaction interaction = interactionRepository.findById(interactionId).orElse(null);
        if (interaction == null || !interaction.getVisit().getId().equals(visitId)) {
            return ResponseEntity.notFound().build();
        }

        interactionRepository.delete(interaction);

        // Update the interaction count
        Visit visit = visitRepository.findById(visitId).orElse(null);
        if (visit != null) {
            Long count = interactionRepository.countByVisitId(visitId);
            visit.setInteractionCount(count.intValue());
            visitRepository.save(visit);
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Interaction supprimée avec succès");
        return ResponseEntity.ok(response);
    }
}
