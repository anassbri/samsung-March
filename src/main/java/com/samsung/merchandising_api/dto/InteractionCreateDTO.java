package com.samsung.merchandising_api.dto;

import lombok.Data;

@Data
public class InteractionCreateDTO {
    private Long productId;
    private String gender;
    private String color;
}
