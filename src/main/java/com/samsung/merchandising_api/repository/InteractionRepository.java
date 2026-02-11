package com.samsung.merchandising_api.repository;

import com.samsung.merchandising_api.model.Interaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InteractionRepository extends JpaRepository<Interaction, Long> {

    List<Interaction> findByVisitId(Long visitId);

    @Query("SELECT COUNT(i) FROM Interaction i WHERE i.visit.id = :visitId")
    Long countByVisitId(Long visitId);

    @Query("SELECT COUNT(i) FROM Interaction i")
    Long countAll();
}
