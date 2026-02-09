package com.samsung.merchandising_api.controller;

import com.samsung.merchandising_api.model.Store;
import com.samsung.merchandising_api.repository.StoreRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/stores")
@CrossOrigin("*")
public class StoreController {

    private final StoreRepository storeRepository;

    public StoreController(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    /**
     * GET /api/stores - Retourne tous les magasins
     */
    @GetMapping
    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    /**
     * GET /api/stores/{id} - Retourne un magasin par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Store> getStoreById(@PathVariable Long id) {
        return storeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/stores - Create a new store
     */
    @PostMapping
    public ResponseEntity<?> createStore(@RequestBody Store store) {
        try {
            validateStore(store);
            Store saved = storeRepository.save(store);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    /**
     * PUT /api/stores/{id} - Update an existing store
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStore(@PathVariable Long id, @RequestBody Store updatedStore) {
        return storeRepository.findById(id)
                .map(existing -> {
                    try {
                        existing.setName(updatedStore.getName());
                        existing.setType(updatedStore.getType());
                        existing.setCity(updatedStore.getCity());
                        existing.setLatitude(updatedStore.getLatitude());
                        existing.setLongitude(updatedStore.getLongitude());
                        existing.setAddress(updatedStore.getAddress());
                        validateStore(existing);
                        Store saved = storeRepository.save(existing);
                        return ResponseEntity.ok(saved);
                    } catch (IllegalArgumentException ex) {
                        return ResponseEntity.badRequest().body(ex.getMessage());
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/stores/{id} - Delete a store
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable Long id) {
        if (!storeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        // TODO: add safety checks when visits/assignments will reference stores
        storeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/stores/bulk - Bulk create/update stores from CSV import
     */
    @PostMapping("/bulk")
    public ResponseEntity<?> bulkUpsertStores(@RequestBody List<Store> stores) {
        if (stores == null || stores.isEmpty()) {
            return ResponseEntity.badRequest().body("Store list is empty");
        }

        List<Store> toSave = new ArrayList<>();
        for (Store store : stores) {
            try {
                validateStore(store);
                toSave.add(store);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body("Invalid store: " + ex.getMessage());
            }
        }

        List<Store> saved = storeRepository.saveAll(toSave);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private void validateStore(Store store) {
        if (store.getName() == null || store.getName().isBlank()) {
            throw new IllegalArgumentException("Store name is required");
        }
        if (store.getType() == null || store.getType().isBlank()) {
            throw new IllegalArgumentException("Store type is required (OR or IR)");
        }
        String type = store.getType().toUpperCase(Locale.ROOT);
        if (!type.equals("OR") && !type.equals("IR")) {
            throw new IllegalArgumentException("Store type must be OR or IR");
        }
        store.setType(type);

        if (store.getLatitude() == null || store.getLongitude() == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }
    }
}