package com.samsung.merchandising_api.service;

import com.samsung.merchandising_api.dto.AssignmentCreateDTO;
import com.samsung.merchandising_api.dto.AssignmentDTO;
import com.samsung.merchandising_api.dto.TaskItemCreateDTO;
import com.samsung.merchandising_api.dto.TaskItemUpdateDTO;
import com.samsung.merchandising_api.model.Assignment;
import com.samsung.merchandising_api.model.AssignmentStatus;
import com.samsung.merchandising_api.model.Role;
import com.samsung.merchandising_api.model.Store;
import com.samsung.merchandising_api.model.TaskItem;
import com.samsung.merchandising_api.model.TaskItemStatus;
import com.samsung.merchandising_api.model.User;
import com.samsung.merchandising_api.repository.AssignmentRepository;
import com.samsung.merchandising_api.repository.StoreRepository;
import com.samsung.merchandising_api.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             UserRepository userRepository,
                             StoreRepository storeRepository) {
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
    }

    public Page<AssignmentDTO> getAssignments(LocalDate date, Long userId, Long storeId, Pageable pageable) {
        if (date != null && userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
            return assignmentRepository.findByUserAndDate(user, date, pageable).map(AssignmentDTO::fromEntity);
        }

        if (date != null && storeId != null) {
            Store store = storeRepository.findById(storeId)
                    .orElseThrow(() -> new IllegalArgumentException("Store not found: " + storeId));
            return assignmentRepository.findByStoreAndDate(store, date, pageable).map(AssignmentDTO::fromEntity);
        }

        if (date != null) {
            return assignmentRepository.findByDate(date, pageable).map(AssignmentDTO::fromEntity);
        }

        return assignmentRepository.findAll(pageable).map(AssignmentDTO::fromEntity);
    }

    @Transactional
    public AssignmentDTO createAssignment(AssignmentCreateDTO dto) {
        Assignment assignment = buildAndValidateAssignment(dto);
        Assignment saved = assignmentRepository.save(assignment);
        return AssignmentDTO.fromEntity(saved);
    }

    @Transactional
    public List<AssignmentDTO> createAssignmentsBulk(List<AssignmentCreateDTO> dtos) {
        List<Assignment> assignments = dtos.stream()
                .map(this::buildAndValidateAssignment)
                .collect(Collectors.toList());
        List<Assignment> saved = assignmentRepository.saveAll(assignments);
        return saved.stream().map(AssignmentDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public AssignmentDTO updateAssignment(Long id, AssignmentCreateDTO dto) {
        Assignment existing = assignmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + id));

        existing.setDate(dto.getDate());
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + dto.getUserId()));
        Store store = storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("Store not found: " + dto.getStoreId()));

        validateUserAndStore(user, store);
        validateNoOverlap(user, dto.getDate(), existing.getId());

        existing.setUser(user);
        existing.setStore(store);
        rebuildTasks(existing, dto.getTasks());

        Assignment saved = assignmentRepository.save(existing);
        return AssignmentDTO.fromEntity(saved);
    }

    public void deleteAssignment(Long id) {
        assignmentRepository.deleteById(id);
    }

    @Transactional
    public AssignmentDTO updateTaskStatuses(Long assignmentId, List<TaskItemUpdateDTO> taskUpdates) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));

        if (taskUpdates == null || taskUpdates.isEmpty()) {
            return AssignmentDTO.fromEntity(assignment);
        }

        Map<Long, TaskItemUpdateDTO> updatesById = taskUpdates.stream()
                .filter(u -> u.getId() != null && u.getStatus() != null)
                .collect(Collectors.toMap(TaskItemUpdateDTO::getId, Function.identity(), (a, b) -> b));

        for (TaskItem task : assignment.getTasks()) {
            TaskItemUpdateDTO dto = updatesById.get(task.getId());
            if (dto != null) {
                task.setStatus(dto.getStatus());
            }
        }

        // Recalculate assignment status based on tasks
        recalculateAssignmentStatus(assignment);

        Assignment saved = assignmentRepository.save(assignment);
        return AssignmentDTO.fromEntity(saved);
    }

    private Assignment buildAndValidateAssignment(AssignmentCreateDTO dto) {
        if (dto.getDate() == null) {
            throw new IllegalArgumentException("Assignment date is required");
        }
        if (dto.getUserId() == null || dto.getStoreId() == null) {
            throw new IllegalArgumentException("UserId and StoreId are required");
        }

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + dto.getUserId()));
        Store store = storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("Store not found: " + dto.getStoreId()));

        validateUserAndStore(user, store);
        validateNoOverlap(user, dto.getDate(), null);

        Assignment assignment = new Assignment();
        assignment.setDate(dto.getDate());
        assignment.setStatus(AssignmentStatus.PLANNED);
        assignment.setUser(user);
        assignment.setStore(store);
        rebuildTasks(assignment, dto.getTasks());
        return assignment;
    }

    private void validateUserAndStore(User user, Store store) {
        if (!(user.getRole() == Role.PROMOTER || user.getRole() == Role.SFOS)) {
            throw new IllegalArgumentException("Assignments are only allowed for PROMOTER or SFOS users");
        }
        if (store == null) {
            throw new IllegalArgumentException("Store must exist");
        }
        // store capacity / active flag could be added here later
    }

    /**
     * Prevent overlapping assignments: one user cannot be assigned to multiple stores on the same date.
     */
    private void validateNoOverlap(User user, LocalDate date, Long currentAssignmentId) {
        List<Assignment> existing = assignmentRepository.findByUserAndDate(user, date);
        boolean conflict = existing.stream()
                .anyMatch(a -> currentAssignmentId == null || !a.getId().equals(currentAssignmentId));
        if (conflict) {
            throw new IllegalArgumentException("User already has an assignment on " + date);
        }
    }

    private void rebuildTasks(Assignment assignment, List<TaskItemCreateDTO> taskDtos) {
        assignment.getTasks().clear();
        if (taskDtos == null) {
            return;
        }
        for (TaskItemCreateDTO dto : taskDtos) {
            if (dto.getDescription() == null || dto.getDescription().isBlank()) {
                continue;
            }
            TaskItem task = new TaskItem();
            task.setDescription(dto.getDescription());
            task.setStatus(dto.getStatus() != null ? dto.getStatus() : TaskItemStatus.TODO);
            task.setAssignment(assignment);
            assignment.getTasks().add(task);
        }
    }

    private void recalculateAssignmentStatus(Assignment assignment) {
        if (assignment.getTasks().isEmpty()) {
            assignment.setStatus(AssignmentStatus.PLANNED);
            return;
        }
        long total = assignment.getTasks().size();
        long done = assignment.getTasks().stream()
                .filter(t -> t.getStatus() == TaskItemStatus.DONE)
                .count();
        long inProgress = assignment.getTasks().stream()
                .filter(t -> t.getStatus() == TaskItemStatus.IN_PROGRESS)
                .count();

        if (done == total) {
            assignment.setStatus(AssignmentStatus.DONE);
        } else if (done > 0 || inProgress > 0) {
            assignment.setStatus(AssignmentStatus.IN_PROGRESS);
        } else {
            assignment.setStatus(AssignmentStatus.PLANNED);
        }
    }
}

