package com.samsung.merchandising_api.controller;

import com.samsung.merchandising_api.dto.AssignmentCreateDTO;
import com.samsung.merchandising_api.dto.AssignmentDTO;
import com.samsung.merchandising_api.model.User;
import com.samsung.merchandising_api.repository.UserRepository;
import com.samsung.merchandising_api.service.AssignmentService;
import io.jsonwebtoken.Claims;
import com.samsung.merchandising_api.service.JwtService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081", "*"})
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AssignmentController(AssignmentService assignmentService,
                                UserRepository userRepository,
                                JwtService jwtService) {
        this.assignmentService = assignmentService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @GetMapping
    public ResponseEntity<Page<AssignmentDTO>> getAssignments(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        LocalDate parsedDate = date != null ? LocalDate.parse(date) : null;
        Pageable pageable = PageRequest.of(page, size);
        Page<AssignmentDTO> result = assignmentService.getAssignments(parsedDate, userId, storeId, pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> createAssignment(@RequestBody AssignmentCreateDTO dto) {
        try {
            AssignmentDTO created = assignmentService.createAssignment(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(error(ex.getMessage()));
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> createAssignmentsBulk(@RequestBody List<AssignmentCreateDTO> dtos) {
        try {
            List<AssignmentDTO> created = assignmentService.createAssignmentsBulk(dtos);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(error(ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAssignment(@PathVariable Long id, @RequestBody AssignmentCreateDTO dto) {
        try {
            AssignmentDTO updated = assignmentService.updateAssignment(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(error(ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/assignments/my?date=YYYY-MM-DD
     * Returns assignments for currently authenticated user (used by mobile).
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyAssignments(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        Claims claims = jwtService.parseToken(token);
        String email = claims.getSubject();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found for token"));

        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        Pageable pageable = PageRequest.of(page, size);
        Page<AssignmentDTO> result = assignmentService.getAssignments(targetDate, user.getId(), null, pageable);
        return ResponseEntity.ok(result);
    }

    private Map<String, String> error(String msg) {
        Map<String, String> map = new HashMap<>();
        map.put("error", msg);
        return map;
    }
}

