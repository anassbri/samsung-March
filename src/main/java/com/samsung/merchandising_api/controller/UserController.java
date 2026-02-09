package com.samsung.merchandising_api.controller;

import com.samsung.merchandising_api.dto.UserCreateDTO;
import com.samsung.merchandising_api.dto.UserResponseDTO;
import com.samsung.merchandising_api.dto.UserStatsDTO;
import com.samsung.merchandising_api.model.Role;
import com.samsung.merchandising_api.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/users/stats - Returns user counts by role
     */
    @GetMapping("/stats")
    public ResponseEntity<UserStatsDTO> getUserStats() {
        UserStatsDTO stats = userService.getUserStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/users - Get all users with pagination and optional role filter
     * Query params: page (default 0), size (default 20), role (optional: PROMOTER, SFOS, SUPERVISOR)
     */
    @GetMapping
    public ResponseEntity<Page<UserResponseDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Role role) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponseDTO> users = userService.getAllUsers(pageable, role);
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/users/{id} - Get user by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/users - Create a new user
     * If role is PROMOTER, sfosId is required
     */
    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(@RequestBody UserCreateDTO dto) {
        try {
            UserResponseDTO created = userService.createUser(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PUT /api/users/{promoterId}/assign/{sfosId} - Assign a promoter to an SFOS
     */
    @PutMapping("/{promoterId}/assign/{sfosId}")
    public ResponseEntity<UserResponseDTO> assignPromoterToSFOS(
            @PathVariable Long promoterId,
            @PathVariable Long sfosId) {
        try {
            UserResponseDTO updated = userService.assignPromoterToSFOS(promoterId, sfosId);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * POST /api/users/bulk - Bulk create users
     */
    @PostMapping("/bulk")
    public ResponseEntity<?> createUsersBulk(@RequestBody java.util.List<UserCreateDTO> dtos) {
        try {
            java.util.List<UserResponseDTO> created = userService.createUsersBulk(dtos);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new java.util.HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }
}
