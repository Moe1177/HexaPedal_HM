package com.hexpedal.backend.model;


import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Column(name = "bike_id", nullable = false)
    private Integer bikeId;

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

}