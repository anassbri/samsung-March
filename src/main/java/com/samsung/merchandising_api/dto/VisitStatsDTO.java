package com.samsung.merchandising_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitStatsDTO {
    private Long totalVisits;
    private Double totalSales;
    private Double avgShelfShare;
}
