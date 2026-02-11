package com.samsung.merchandising_api.controller;

import com.samsung.merchandising_api.dto.DashboardSummaryDTO;
import com.samsung.merchandising_api.model.AssignmentStatus;
import com.samsung.merchandising_api.repository.AssignmentRepository;
import com.samsung.merchandising_api.repository.VisitRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final VisitRepository visitRepository;
    private final AssignmentRepository assignmentRepository;

    public DashboardController(VisitRepository visitRepository,
                               AssignmentRepository assignmentRepository) {
        this.visitRepository = visitRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @GetMapping("/summary")
    public DashboardSummaryDTO getSummary() {
        Long totalVisits = visitRepository.countCompletedVisits();
        Double totalSales = visitRepository.sumTotalSales();
        Double avgShelfShare = visitRepository.avgShelfShare();

        LocalDate today = LocalDate.now();
        long planned = assignmentRepository.countByDateAndStatus(today, AssignmentStatus.PLANNED);
        long done = assignmentRepository.countByDateAndStatus(today, AssignmentStatus.DONE);

        return new DashboardSummaryDTO(totalVisits, totalSales, avgShelfShare, planned, done);
    }
}

