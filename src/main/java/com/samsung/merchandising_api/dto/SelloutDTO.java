package com.samsung.merchandising_api.dto;

import com.samsung.merchandising_api.model.Sellout;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SelloutDTO {
    private Long id;
    private Long visitId;
    private Long productId;
    private String productName;
    private String productSku;
    private Integer quantity;
    private Double amount;
    private LocalDateTime createdAt;

    public static SelloutDTO fromEntity(Sellout sellout) {
        SelloutDTO dto = new SelloutDTO();
        dto.setId(sellout.getId());
        dto.setVisitId(sellout.getVisit().getId());
        if (sellout.getProduct() != null) {
            dto.setProductId(sellout.getProduct().getId());
            dto.setProductName(sellout.getProduct().getName());
            dto.setProductSku(sellout.getProduct().getSku());
        }
        dto.setQuantity(sellout.getQuantity());
        dto.setAmount(sellout.getAmount());
        dto.setCreatedAt(sellout.getCreatedAt());
        return dto;
    }
}
