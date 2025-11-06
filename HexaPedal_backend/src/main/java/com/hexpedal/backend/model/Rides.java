package com.hexpedal.backend.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "rides")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Rides {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ride_id")
    private Integer ride_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "start_location", nullable = false)
    private String startLocation;

    @Column(name = "end_location", nullable = false)
    private String endLocation;

    @Column(name = "start_timestamp", nullable = false)
    private Instant startTimestamp;

    @Column(name = "end_timestamp", nullable = false)
    private Instant endTimestamp;

    @Column(name = "duration", nullable = false)
    private double duration;

    @Column(name = "distance", nullable = false)
    private double distance; 

    @Column(name = "cost", nullable = false)
    private double cost;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bike_id", nullable = false)
    private Bike bike;

    @Enumerated(EnumType.STRING)
    @Column(name = "ride_status", nullable = false)
    private RideStatus rideStatus;

    private Double baseFee;
    private Double timeFee;
    private Double lateFee;
    private Double totalCost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PricingPlan pricingPlan;

    @Column(length = 1000)
    private String costBreakdown;

    public void calculateDuration(){
        if(startTimestamp != null && endTimestamp != null){
            this.duration = (endTimestamp.getEpochSecond() - startTimestamp.getEpochSecond()) / 60.0; // duration in minutes
        } else {
            this.duration = 0;
        }
    }
}