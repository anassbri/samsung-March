package com.samsung.merchandising_api.dto;

import com.samsung.merchandising_api.model.TaskItemStatus;
import lombok.Data;

@Data
public class TaskItemCreateDTO {
    private String description;
    private TaskItemStatus status = TaskItemStatus.TODO;
}

