package com.samsung.merchandising_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private Long totalVisitsCompleted;
    private Double totalSales;
    private Double avgShelfShare;

    private Long assignmentsPlannedToday;
    private Long assignmentsDoneToday;
}

