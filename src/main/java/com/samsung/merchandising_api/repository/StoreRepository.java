package com.samsung.merchandising_api.repository;

import com.samsung.merchandising_api.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {

    // Recherche par ville
    List<Store> findByCity(String city);

    // Recherche par type (OR ou IR)
    List<Store> findByType(String type);

    // Recherche par ville et type
    List<Store> findByCityAndType(String city, String type);
}
