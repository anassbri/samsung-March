package com.samsung.merchandising_api.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class AssignmentCreateDTO {
    private LocalDate date;
    private Long userId;
    private Long storeId;
    private List<TaskItemCreateDTO> tasks;
}

