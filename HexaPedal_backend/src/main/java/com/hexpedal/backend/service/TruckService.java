package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.CreateTruckRequestDTO;
import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.BikeStatus;
import com.hexpedal.backend.model.Dock;
import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.model.Map;
import com.hexpedal.backend.model.MapEntity;
import com.hexpedal.backend.model.Truck;
import com.hexpedal.backend.repository.BikeRepository;
import com.hexpedal.backend.repository.DockRepository;
import com.hexpedal.backend.repository.DockingStationRepository;
import com.hexpedal.backend.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.util.List;

@Service
@RequiredArgsConstructor
public class TruckService {

    private final TruckRepository truckRepository;
    private final BikeRepository bikeRepository;
    private final DockRepository dockRepository;
    private final DockingStationRepository stationRepository;

    @Transactional
    public void ensureBikesOnTrucksHaveMaintenanceStatus() {
        List<Truck> trucks = truckRepository.findAll();
        
        for (Truck truck : trucks) {
            for (Bike bike : truck.getBikes()) {
                if (bike.getBikeStatus() != BikeStatus.maintenance) {
                    Bike managedBike = bikeRepository.findById(bike.getId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bike not found: " + bike.getId()));
                    managedBike.setBikeStatus(BikeStatus.maintenance);
                    bikeRepository.save(managedBike);
                }
            }
        }
    }

    public List<Truck> getAllTrucks() {
        ensureBikesOnTrucksHaveMaintenanceStatus();
        
        return truckRepository.findAll();
    }

    public Truck getTruck(Long id) {
        return truckRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Truck not found: " + id));
    }

    public Truck createTruck(CreateTruckRequestDTO req) {
        if (req.capacity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Capacity must be > 0");
        }

        Truck truck = Truck.builder()
                .capacity(req.capacity())
                .build();
    
        if (truck.getBikes() == null) {
            truck.setBikes(new java.util.ArrayList<>());
        }

        return truckRepository.save(truck);
    }

    @Transactional
    public Truck loadBikeOntoTruck(Long truckId, Integer bikeId) {
        Truck truck = getTruck(truckId);

        if (truck.isFull()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Truck " + truckId + " is already full.");
        }

        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Bike not found: " + bikeId));
        List<Truck> allTrucks = truckRepository.findAll();
        for (Truck otherTruck : allTrucks) {
            if (!otherTruck.getId().equals(truckId) && 
                otherTruck.getBikes().stream().anyMatch(b -> b.getId() == bikeId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Bike " + bikeId + " is already on truck " + otherTruck.getId());
            }
        }

        dockRepository.findByBike_Id(bikeId).ifPresent(dock -> {
            dock.setBike(null);
            dockRepository.save(dock);
        });
        bike.setBikeStatus(BikeStatus.maintenance);
        Bike savedBike = bikeRepository.save(bike);
        
        truck.loadBike(savedBike);

        return truckRepository.save(truck);
    }

    @Transactional
    public Truck unloadBikeFromTruckToStation(Long truckId, Integer bikeId, Long stationId) {
        Truck truck = getTruck(truckId);

        Bike bike = truck.getBikes().stream()
                .filter(b -> b.getId() == bikeId)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Bike " + bikeId + " is not on truck " + truckId));

        DockingStation station = stationRepository.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Station not found: " + stationId));
        if (station.getStatus() == com.hexpedal.backend.model.DockingStationStates.out_of_service) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot unload bike: station " + stationId + " is out of service.");
        }

        Dock emptyDock = dockRepository.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No empty dock available at station " + stationId));
        emptyDock.setBike(bike);
        dockRepository.save(emptyDock);
        bike.setBikeStatus(BikeStatus.available);
        bikeRepository.save(bike);
        truck.unloadBike(bike);
        refreshAndNotifyCachedStation(stationId);

        return truckRepository.save(truck);
    }
    

    private void refreshAndNotifyCachedStation(Long stationId) {
        DockingStation freshStation = stationRepository.findById(stationId).orElse(null);
        if (freshStation == null) return;
        for (MapEntity entity : Map.getInstance().getMapEntities()) {
            if (entity instanceof DockingStation) {
                DockingStation cachedStation = (DockingStation) entity;
                if (cachedStation.getId().equals(stationId)) {
                    cachedStation.setStatus(freshStation.getStatus());
                    break;
                }
            }
        }
    }
}
