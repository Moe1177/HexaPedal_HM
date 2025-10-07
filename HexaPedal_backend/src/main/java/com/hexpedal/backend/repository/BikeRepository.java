package com.hexpedal.backend.repository;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.CrudRepository;

import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.BikeStatus;
import com.hexpedal.backend.model.User;
import java.util.List;
import java.util.Optional;

@Repository
public interface BikeRepository extends CrudRepository<Bike, Integer> {

    List<Bike> findAll();
    List<Bike> findByBikeStatus(BikeStatus status);
    Optional<Bike> findByIdAndBikeStatus(Integer id, BikeStatus status);
    boolean existsByCurrentUserAndBikeStatus(User currentUser, BikeStatus status);
    List<Bike> findByBikeStatusAndType(BikeStatus status, String type);
    List<Bike> findByCurrentUser(User user);


    
}
