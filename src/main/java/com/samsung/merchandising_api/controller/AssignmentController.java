package com.samsung.merchandising_api.controller;

import com.samsung.merchandising_api.dto.AssignmentCreateDTO;
import com.samsung.merchandising_api.dto.AssignmentDTO;
import com.samsung.merchandising_api.dto.TaskItemUpdateDTO;
import com.samsung.merchandising_api.model.User;
import com.samsung.merchandising_api.repository.AssignmentRepository;
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
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AssignmentController(AssignmentService assignmentService,
                                AssignmentRepository assignmentRepository,
                                UserRepository userRepository,
                                JwtService jwtService) {
        this.assignmentService = assignmentService;
        this.assignmentRepository = assignmentRepository;
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

    @PatchMapping("/{id}/tasks")
    public ResponseEntity<?> updateAssignmentTasks(@PathVariable Long id,
                                                   @RequestBody List<TaskItemUpdateDTO> tasks) {
        try {
            AssignmentDTO updated = assignmentService.updateTaskStatuses(id, tasks);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(error(ex.getMessage()));
        }
    }

    /**
     * POST fallback for task updates – some proxies (e.g. ngrok free) block PATCH.
     * Mobile clients can call POST /api/assignments/{id}/update-tasks instead.
     */
    @PostMapping("/{id}/update-tasks")
    public ResponseEntity<?> updateAssignmentTasksPost(@PathVariable Long id,
                                                       @RequestBody List<TaskItemUpdateDTO> tasks) {
        try {
            AssignmentDTO updated = assignmentService.updateTaskStatuses(id, tasks);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(error(ex.getMessage()));
        }
    }

    /**
     * GET /api/assignments/team?date=YYYY-MM-DD
     * Returns assignments for the SFOS user's team (promoters under this SFOS).
     */
    @GetMapping("/team")
    public ResponseEntity<?> getTeamAssignments(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String date) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        Claims claims = jwtService.parseToken(token);
        String email = claims.getSubject();

        User sfos = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found for token"));

        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        // Get all promoters under this SFOS
        List<User> teamMembers = userRepository.findByManagerId(sfos.getId());
        // Also include the SFOS's own assignments
        teamMembers.add(sfos);

        List<Long> teamIds = teamMembers.stream().map(User::getId).collect(java.util.stream.Collectors.toList());
        List<com.samsung.merchandising_api.model.Assignment> allAssignments =
                assignmentRepository.findByUserIdInAndDate(teamIds, targetDate);

        List<AssignmentDTO> result = allAssignments.stream()
                .map(AssignmentDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(result);
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

