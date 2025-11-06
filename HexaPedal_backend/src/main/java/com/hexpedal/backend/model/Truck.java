package com.hexpedal.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trucks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Truck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private int capacity;

    @ManyToMany
    @JoinTable(
            name = "truck_bikes",
            joinColumns = @JoinColumn(name = "truck_id"),
            inverseJoinColumns = @JoinColumn(name = "bike_id")
    )
    private List<Bike> bikes = new ArrayList<>();

    public boolean isFull() {
        return bikes.size() >= capacity;
    }

    public void loadBike(Bike bike) {
        if (isFull()) {
            throw new IllegalStateException("Truck is full, cannot load more bikes.");
        }
        if (!bikes.contains(bike)) {
            bikes.add(bike);
        }
    }

    public void unloadBike(Bike bike) {
        bikes.remove(bike);
    }
}
