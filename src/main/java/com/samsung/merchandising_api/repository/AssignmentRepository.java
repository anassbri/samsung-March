package com.samsung.merchandising_api.repository;

import com.samsung.merchandising_api.model.Assignment;
import com.samsung.merchandising_api.model.AssignmentStatus;
import com.samsung.merchandising_api.model.Store;
import com.samsung.merchandising_api.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    Page<Assignment> findByDate(LocalDate date, Pageable pageable);

    Page<Assignment> findByUserAndDate(User user, LocalDate date, Pageable pageable);

    Page<Assignment> findByStoreAndDate(Store store, LocalDate date, Pageable pageable);

    List<Assignment> findByUserAndDate(User user, LocalDate date);

    long countByDateAndStatus(LocalDate date, AssignmentStatus status);
}

