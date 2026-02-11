package com.samsung.merchandising_api.dto;

import com.samsung.merchandising_api.model.Interaction;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InteractionDTO {
    private Long id;
    private Long visitId;
    private Long productId;
    private String productName;
    private String productSku;
    private String gender;
    private String color;
    private LocalDateTime createdAt;

    public static InteractionDTO fromEntity(Interaction interaction) {
        InteractionDTO dto = new InteractionDTO();
        dto.setId(interaction.getId());
        dto.setVisitId(interaction.getVisit().getId());
        if (interaction.getProduct() != null) {
            dto.setProductId(interaction.getProduct().getId());
            dto.setProductName(interaction.getProduct().getName());
            dto.setProductSku(interaction.getProduct().getSku());
        }
        dto.setGender(interaction.getGender());
        dto.setColor(interaction.getColor());
        dto.setCreatedAt(interaction.getCreatedAt());
        return dto;
    }
}
