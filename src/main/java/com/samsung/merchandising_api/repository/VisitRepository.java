package com.samsung.merchandising_api.repository;

import com.samsung.merchandising_api.model.Visit;
import com.samsung.merchandising_api.model.VisitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {

    List<Visit> findByStatus(VisitStatus status);

    List<Visit> findByUserId(Long userId);

    List<Visit> findByStoreId(Long storeId);

    List<Visit> findByVisitDateBetween(LocalDateTime start, LocalDateTime end);

    // Récupérer toutes les visites triées par date (plus récentes en premier)
    @Query(value = "SELECT * FROM visits ORDER BY visit_date DESC", nativeQuery = true)
    List<Visit> findAllByVisitDateDescNative();

    // KPI Queries
    @Query("SELECT COUNT(v) FROM Visit v WHERE v.status = 'COMPLETED'")
    Long countCompletedVisits();

    @Query("SELECT COALESCE(SUM(v.salesAmount), 0) FROM Visit v WHERE v.status = 'COMPLETED'")
    Double sumTotalSales();

    @Query("SELECT COALESCE(AVG(v.shelfShare), 0) FROM Visit v WHERE v.status = 'COMPLETED'")
    Double avgShelfShare();
}
