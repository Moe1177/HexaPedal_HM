package com.hexpedal.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "rides")  
public class Rides {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ride_id")                          
    private Integer rideId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "start_location", nullable = false)
    private String startLocation;

    @Column(name = "end_location", nullable = false)
    private String endLocation;


    @Column(name = "duration", nullable = false)
    private Float duration;


    @Column(name = "distance", nullable = false)
    private Float distance;

    public Rides(Integer userId, String startLocation, String endLocation, Float duration, Float distance) {
        this.userId = userId;
        this.startLocation = startLocation;
        this.endLocation = endLocation;
        this.duration = duration;
        this.distance = distance;
    }



    public Integer getId() { 
        return userId; 
    }
    public void setId(Integer id) { 
        this.userId = id; 
    }

    public Integer getUserId() { 
        return userId;
     }
    public void setUserId(Integer userId) { 
        this.userId = userId; 
    }

    public String getStartLocation() { 
        return startLocation;
     }
    public void setStartLocation(String startLocation) { 
        this.startLocation = startLocation; 
    }

    public String getEndLocation() { 
        return endLocation; 
    }
    public void setEndLocation(String endLocation) { 
        this.endLocation = endLocation; 
    }

    public Float getDuration() { return duration; }
    public void setDuration(Float duration) {
         this.duration = duration; 
    }

    public Float getDistance() { 
        return distance; 
    }
    public void setDistance(Float distance) { 
        this.distance = distance; 
    }
}
