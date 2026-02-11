package com.samsung.merchandising_api.dto;

import com.samsung.merchandising_api.model.Visit;
import com.samsung.merchandising_api.model.VisitStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitResponseDTO {
    private Long id;
    private LocalDateTime visitDate;
    private VisitStatus status;
    private Double salesAmount;
    private Double shelfShare;
    private Integer interactionCount;
    private String comment;
    private Double checkInLatitude;
    private Double checkInLongitude;
    private String photoUrl;
    
    // Store information
    private Long storeId;
    private String storeName;
    private String storeCity;
    
    // User information
    private Long userId;
    private String userName;
    private String userRole;

    // Assignment & tasks
    private Long assignmentId;
    private Integer totalTasks;
    private Integer completedTasks;

    // Interactions & Sellout details (populated separately)
    private List<InteractionDTO> interactions = new ArrayList<>();
    private List<SelloutDTO> selloutItems = new ArrayList<>();

    public static VisitResponseDTO fromVisit(Visit visit) {
        VisitResponseDTO dto = new VisitResponseDTO();
        dto.setId(visit.getId());
        dto.setVisitDate(visit.getVisitDate());
        dto.setStatus(visit.getStatus());
        dto.setSalesAmount(visit.getSalesAmount());
        dto.setShelfShare(visit.getShelfShare());
        dto.setInteractionCount(visit.getInteractionCount());
        dto.setComment(visit.getComment());
        dto.setCheckInLatitude(visit.getCheckInLatitude());
        dto.setCheckInLongitude(visit.getCheckInLongitude());
        dto.setPhotoUrl(visit.getPhotoUrl());

        // Store information
        if (visit.getStore() != null) {
            dto.setStoreId(visit.getStore().getId());
            dto.setStoreName(visit.getStore().getName());
            dto.setStoreCity(visit.getStore().getCity());
        }

        // User information
        if (visit.getUser() != null) {
            dto.setUserId(visit.getUser().getId());
            dto.setUserName(visit.getUser().getFullName());
            dto.setUserRole(visit.getUser().getRole().toString());
        }

        // Assignment summary
        if (visit.getAssignment() != null) {
            dto.setAssignmentId(visit.getAssignment().getId());
            if (visit.getAssignment().getTasks() != null) {
                int total = visit.getAssignment().getTasks().size();
                int completed = (int) visit.getAssignment().getTasks().stream()
                        .filter(t -> t.getStatus() != null && t.getStatus().name().equals("DONE"))
                        .count();
                dto.setTotalTasks(total);
                dto.setCompletedTasks(completed);
            }
        }

        return dto;
    }
}
