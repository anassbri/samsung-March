package com.samsung.merchandising_api.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "products")
@Data
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 50, unique = true)
    private String sku;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ProductType type;

    @Column(length = 100)
    private String subCategory;

    @Column
    private Double price;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column
    private Integer stock = 0;
}
