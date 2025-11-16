package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.CreateTruckRequestDTO;
import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.BikeStatus;
import com.hexpedal.backend.model.Dock;
import com.hexpedal.backend.model.DockingStation;
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

    public List<Truck> getAllTrucks() {
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

        Dock dock = dockRepository.findByBike_Id(bikeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Bike " + bikeId + " is not currently docked in a station."));

        if (bike.getBikeStatus() != BikeStatus.available) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bike " + bikeId + " is not available for loading. Current status: " + bike.getBikeStatus());
        }

        dock.setBike(null);
        dockRepository.save(dock);
        bike.setBikeStatus(BikeStatus.maintenance);
        bikeRepository.save(bike);
        truck.loadBike(bike);

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

        return truckRepository.save(truck);
    }
}
