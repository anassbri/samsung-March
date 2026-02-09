package com.samsung.merchandising_api.repository;

import com.samsung.merchandising_api.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    java.util.Optional<Product> findBySku(String sku);
}
