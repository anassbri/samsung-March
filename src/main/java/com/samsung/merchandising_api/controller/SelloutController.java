package com.samsung.merchandising_api.controller;

import com.samsung.merchandising_api.dto.SelloutCreateDTO;
import com.samsung.merchandising_api.dto.SelloutDTO;
import com.samsung.merchandising_api.model.Product;
import com.samsung.merchandising_api.model.Sellout;
import com.samsung.merchandising_api.model.Visit;
import com.samsung.merchandising_api.repository.ProductRepository;
import com.samsung.merchandising_api.repository.SelloutRepository;
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
@RequestMapping("/api/visits/{visitId}/sellout")
@CrossOrigin(origins = "*")
public class SelloutController {

    private final SelloutRepository selloutRepository;
    private final VisitRepository visitRepository;
    private final ProductRepository productRepository;

    public SelloutController(SelloutRepository selloutRepository,
                              VisitRepository visitRepository,
                              ProductRepository productRepository) {
        this.selloutRepository = selloutRepository;
        this.visitRepository = visitRepository;
        this.productRepository = productRepository;
    }

    /**
     * GET /api/visits/{visitId}/sellout - Get all sellout items for a visit
     */
    @GetMapping
    public ResponseEntity<?> getSelloutByVisit(@PathVariable Long visitId) {
        if (!visitRepository.existsById(visitId)) {
            return ResponseEntity.notFound().build();
        }
        List<SelloutDTO> sellouts = selloutRepository.findByVisitId(visitId)
                .stream()
                .map(SelloutDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(sellouts);
    }

    /**
     * POST /api/visits/{visitId}/sellout - Add a single sellout entry
     */
    @PostMapping
    public ResponseEntity<?> addSellout(@PathVariable Long visitId,
                                         @RequestBody SelloutCreateDTO dto) {
        Visit visit = visitRepository.findById(visitId).orElse(null);
        if (visit == null) {
            return ResponseEntity.notFound().build();
        }

        Product product = productRepository.findById(dto.getProductId()).orElse(null);
        if (product == null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Produit non trouvé avec l'ID: " + dto.getProductId());
            return ResponseEntity.badRequest().body(error);
        }

        Sellout sellout = new Sellout();
        sellout.setVisit(visit);
        sellout.setProduct(product);
        sellout.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 0);
        sellout.setAmount(dto.getAmount() != null ? dto.getAmount() : 0.0);
        sellout.setCreatedAt(LocalDateTime.now());

        Sellout saved = selloutRepository.save(sellout);

        // Update the salesAmount on the Visit with the total sellout
        Double totalAmount = selloutRepository.sumAmountByVisitId(visitId);
        visit.setSalesAmount(totalAmount);
        visitRepository.save(visit);

        return ResponseEntity.status(HttpStatus.CREATED).body(SelloutDTO.fromEntity(saved));
    }

    /**
     * POST /api/visits/{visitId}/sellout/batch - Add multiple sellout entries at once
     */
    @PostMapping("/batch")
    public ResponseEntity<?> addSelloutBatch(@PathVariable Long visitId,
                                               @RequestBody List<SelloutCreateDTO> dtos) {
        Visit visit = visitRepository.findById(visitId).orElse(null);
        if (visit == null) {
            return ResponseEntity.notFound().build();
        }

        List<SelloutDTO> results = new ArrayList<>();
        for (SelloutCreateDTO dto : dtos) {
            Product product = productRepository.findById(dto.getProductId()).orElse(null);
            if (product == null) continue; // skip invalid products

            Sellout sellout = new Sellout();
            sellout.setVisit(visit);
            sellout.setProduct(product);
            sellout.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 0);
            sellout.setAmount(dto.getAmount() != null ? dto.getAmount() : 0.0);
            sellout.setCreatedAt(LocalDateTime.now());

            Sellout saved = selloutRepository.save(sellout);
            results.add(SelloutDTO.fromEntity(saved));
        }

        // Update the salesAmount on the Visit with the total sellout
        Double totalAmount = selloutRepository.sumAmountByVisitId(visitId);
        visit.setSalesAmount(totalAmount);
        visitRepository.save(visit);

        return ResponseEntity.status(HttpStatus.CREATED).body(results);
    }

    /**
     * DELETE /api/visits/{visitId}/sellout/{selloutId} - Delete a sellout entry
     */
    @DeleteMapping("/{selloutId}")
    public ResponseEntity<?> deleteSellout(@PathVariable Long visitId,
                                            @PathVariable Long selloutId) {
        Sellout sellout = selloutRepository.findById(selloutId).orElse(null);
        if (sellout == null || !sellout.getVisit().getId().equals(visitId)) {
            return ResponseEntity.notFound().build();
        }

        selloutRepository.delete(sellout);

        // Update the salesAmount on the Visit
        Visit visit = visitRepository.findById(visitId).orElse(null);
        if (visit != null) {
            Double totalAmount = selloutRepository.sumAmountByVisitId(visitId);
            visit.setSalesAmount(totalAmount);
            visitRepository.save(visit);
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Sellout supprimé avec succès");
        return ResponseEntity.ok(response);
    }
}
