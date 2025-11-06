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
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    @Column(name = "ride_id")
    private Integer rideId;
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

  
    public Rides(User user,String startLocation,String endLocation,Instant startTimestamp,Instant endTimestamp,double duration,double distance,double cost) {
        this.user = user;
        this.startLocation = startLocation;
        this.endLocation = endLocation;
        this.startTimestamp = startTimestamp;
        this.endTimestamp = endTimestamp;
        this.duration = duration;
        this.distance = distance;
        this.cost = cost;
    }
}

