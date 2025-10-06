package com.hexpedal.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "docks")
public class Dock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;             

    @OneToOne
    @JoinColumn(name = "bike_id", unique = true)
    private Bike bike;


    public Dock() {

    }

    public Integer getId() { 
        return id;
    }
    public void setId(Integer id) { 
        this.id = id;
    }

    public Bike getBike() { 
        return bike;
    }
    public void setBike(Bike bike) { 
        this.bike = bike;
    }

 
    public boolean isEmpty() { 
        return this.bike == null;
    }


    public void assignBike(Bike bike) { 
        this.bike = bike;
    }

    
    public Bike removeBike() {
        Bike b = this.bike;
        this.bike = null;
        return b;
    }
}
