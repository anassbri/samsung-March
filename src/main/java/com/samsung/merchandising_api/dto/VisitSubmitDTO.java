package com.samsung.merchandising_api.dto;

import lombok.Data;

@Data
public class VisitSubmitDTO {
    private Long storeId;
    private Long userId;
    private Double shelfShare;
    private String comment;
    private Long assignmentId;
    private Double checkInLatitude;
    private Double checkInLongitude;
}
