package com.samsung.merchandising_api.dto;

import lombok.Data;

@Data
public class VisitRequest {
    private Long userId;
    private Long storeId;
    private Double shelfShare;
    private String comment;
    private Long assignmentId;
    private Double checkInLatitude;
    private Double checkInLongitude;
}
