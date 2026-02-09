package com.samsung.merchandising_api.dto;

import com.samsung.merchandising_api.model.TaskItem;
import com.samsung.merchandising_api.model.TaskItemStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskItemDTO {
    private Long id;
    private String description;
    private TaskItemStatus status;

    public static TaskItemDTO fromEntity(TaskItem task) {
        return new TaskItemDTO(task.getId(), task.getDescription(), task.getStatus());
    }
}

