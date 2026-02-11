package com.samsung.merchandising_api.dto;

import com.samsung.merchandising_api.model.Assignment;
import com.samsung.merchandising_api.model.AssignmentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentDTO {

    private Long id;
    private LocalDate date;
    private AssignmentStatus status;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;

    private Long userId;
    private String userName;
    private String userRole;

    private Long storeId;
    private String storeName;
    private String storeCity;
    private String storeType;
    private Double storeLatitude;
    private Double storeLongitude;
    private String storeAddress;

    private List<TaskItemDTO> tasks;
    private int completedTasks;
    private int totalTasks;

    public static AssignmentDTO fromEntity(Assignment assignment) {
        List<TaskItemDTO> taskDTOs = assignment.getTasks().stream()
                .map(TaskItemDTO::fromEntity)
                .collect(Collectors.toList());
        int total = taskDTOs.size();
        int completed = (int) taskDTOs.stream()
                .filter(t -> t.getStatus() == com.samsung.merchandising_api.model.TaskItemStatus.DONE)
                .count();

        AssignmentDTO dto = new AssignmentDTO();
        dto.setId(assignment.getId());
        dto.setDate(assignment.getDate());
        dto.setStatus(assignment.getStatus());
        dto.setCheckInTime(assignment.getCheckInTime());
        dto.setCheckOutTime(assignment.getCheckOutTime());
        dto.setUserId(assignment.getUser().getId());
        dto.setUserName(assignment.getUser().getFullName());
        dto.setUserRole(assignment.getUser().getRole().name());
        dto.setStoreId(assignment.getStore().getId());
        dto.setStoreName(assignment.getStore().getName());
        dto.setStoreCity(assignment.getStore().getCity());
        dto.setStoreType(assignment.getStore().getType());
        dto.setStoreLatitude(assignment.getStore().getLatitude());
        dto.setStoreLongitude(assignment.getStore().getLongitude());
        dto.setStoreAddress(assignment.getStore().getAddress());
        dto.setTasks(taskDTOs);
        dto.setTotalTasks(total);
        dto.setCompletedTasks(completed);
        return dto;
    }
}

