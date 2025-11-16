package com.hexpedal.backend.service;

import com.hexpedal.backend.model.User;
import com.hexpedal.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class FlexDollarService {

    private final UserRepository userRepository;

    public FlexDollarService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User addFlexDollars(User user, int amount) {
        // Check the discriminator value or class name
        if (user.getClass().getSimpleName().equals("Operator")) {
            throw new RuntimeException("User is not a Rider (Operators cannot earn flex dollars)");
        }

        // flexDollars is a field in User entity
        Integer currentFlexDollars = user.getFlexDollars();
        if (currentFlexDollars == null) {
            currentFlexDollars = 0;
        }
        user.setFlexDollars(currentFlexDollars + amount);

        System.out.println(amount + " flex dollars granted to " + user.getEmail());
        return userRepository.save(user);
    }

    public User addFlexDollars(Long userId, int amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return addFlexDollars(user, amount);
    }
}