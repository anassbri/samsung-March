package com.samsung.merchandising_api.repository;

import com.samsung.merchandising_api.model.Sellout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SelloutRepository extends JpaRepository<Sellout, Long> {

    List<Sellout> findByVisitId(Long visitId);

    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM Sellout s WHERE s.visit.id = :visitId")
    Double sumAmountByVisitId(Long visitId);

    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM Sellout s WHERE s.visit.id = :visitId")
    Long sumQuantityByVisitId(Long visitId);

    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM Sellout s")
    Double sumTotalAmount();
}
