package com.samsung.merchandising_api.service;

import com.samsung.merchandising_api.dto.ProductDTO;
import com.samsung.merchandising_api.model.Product;
import com.samsung.merchandising_api.model.ProductType;
import com.samsung.merchandising_api.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
                .map(ProductDTO::fromProduct)
                .collect(Collectors.toList());
    }

    public Optional<ProductDTO> getProductById(Long id) {
        return productRepository.findById(id)
                .map(ProductDTO::fromProduct);
    }

    public ProductDTO createProduct(ProductDTO dto) {
        Product product = new Product();
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setSku(dto.getSku());

        if (dto.getType() != null) {
            product.setType(ProductType.valueOf(dto.getType()));
        }

        product.setSubCategory(dto.getSubCategory());
        product.setPrice(dto.getPrice());
        product.setImageUrl(dto.getImageUrl());
        product.setStock(dto.getStock() != null ? dto.getStock() : 0);

        Product saved = productRepository.save(product);
        return ProductDTO.fromProduct(saved);
    }

    /**
     * Bulk create products
     * Validates SKU uniqueness
     */
    @org.springframework.transaction.annotation.Transactional
    public List<ProductDTO> createProductsBulk(List<ProductDTO> dtos) {
        List<Product> productsToSave = new java.util.ArrayList<>();
        
        for (ProductDTO dto : dtos) {
            // Validate SKU uniqueness
            if (productRepository.findBySku(dto.getSku()).isPresent()) {
                throw new IllegalArgumentException("SKU already exists: " + dto.getSku());
            }

            Product product = new Product();
            product.setName(dto.getName());
            product.setDescription(dto.getDescription());
            product.setSku(dto.getSku());

            if (dto.getType() != null) {
                product.setType(ProductType.valueOf(dto.getType()));
            }

            product.setSubCategory(dto.getSubCategory());
            product.setPrice(dto.getPrice());
            product.setImageUrl(dto.getImageUrl());
            product.setStock(dto.getStock() != null ? dto.getStock() : 0);

            productsToSave.add(product);
        }

        List<Product> savedProducts = productRepository.saveAll(productsToSave);
        return savedProducts.stream()
                .map(ProductDTO::fromProduct)
                .collect(Collectors.toList());
    }
}
