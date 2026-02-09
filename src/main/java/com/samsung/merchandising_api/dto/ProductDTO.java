package com.samsung.merchandising_api.dto;

import com.samsung.merchandising_api.model.Product;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private String sku;
    private String type;
    private String subCategory;
    private Double price;
    private String imageUrl;
    private Integer stock;

    public static ProductDTO fromProduct(Product product) {
        return new ProductDTO(
            product.getId(),
            product.getName(),
            product.getDescription(),
            product.getSku(),
            product.getType() != null ? product.getType().name() : null,
            product.getSubCategory(),
            product.getPrice(),
            product.getImageUrl(),
            product.getStock()
        );
    }
}
