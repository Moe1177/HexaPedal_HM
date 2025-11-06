package com.hexpedal.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripSummaryDTO {
    private Long tripId;
    private Integer bikeId;
    private String bikeType;
    private String originStationName;
    private String originStationAddress;
    private String destinationStationName;
    private String destinationStationAddress;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long durationMinutes;
    private Double baseFee;
    private Double timeFee;
    private Double lateFee;
    private Double totalCost;
    private String costBreakdown;
    private String pricingPlanName;
}
