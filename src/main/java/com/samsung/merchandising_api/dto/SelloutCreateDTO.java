package com.samsung.merchandising_api.dto;

import lombok.Data;

@Data
public class SelloutCreateDTO {
    private Long productId;
    private Integer quantity;
    private Double amount;
}
