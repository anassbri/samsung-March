package com.samsung.merchandising_api.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "visits")
@Data
public class Visit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visit_date", nullable = false)
    private LocalDateTime visitDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VisitStatus status = VisitStatus.PLANNED;

    @Column(name = "sales_amount")
    private Double salesAmount;

    @Column(name = "shelf_share")
    private Double shelfShare;

    @Column(name = "interaction_count")
    private Integer interactionCount;

    @Column(length = 500)
    private String comment;

    @Column(name = "check_in_latitude")
    private Double checkInLatitude;

    @Column(name = "check_in_longitude")
    private Double checkInLongitude;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignment_id")
    private Assignment assignment;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "visit_task_statuses", joinColumns = @JoinColumn(name = "visit_id"))
    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private List<TaskItemStatus> taskStatuses = new ArrayList<>();
}
