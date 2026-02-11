package com.samsung.merchandising_api.dto;

import com.samsung.merchandising_api.model.TaskItemStatus;
import lombok.Data;

@Data
public class TaskItemUpdateDTO {
    private Long id;
    private TaskItemStatus status;
}

