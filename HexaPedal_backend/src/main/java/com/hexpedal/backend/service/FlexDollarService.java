package com.hexpedal.backend.service;

import com.hexpedal.backend.model.User;
import com.hexpedal.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FlexDollarService {

    private final UserRepository userRepository;

    public FlexDollarService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User addFlexDollars(User user, int amount) {

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

    public int getAvailableFlexDollars(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Integer flexDollars = user.getFlexDollars();
        return flexDollars != null ? flexDollars : 0;
    }


    @Transactional
    public int deductFlexDollars(Long userId, int amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Integer currentFlexDollars = user.getFlexDollars();
        if (currentFlexDollars == null) {
            currentFlexDollars = 0;
        }

        int amountToDeduct = Math.min(amount, currentFlexDollars);
        user.setFlexDollars(currentFlexDollars - amountToDeduct);
        userRepository.save(user);

        if (amountToDeduct > 0) {
            System.out.println("Deducted " + amountToDeduct + " flex dollars from " + user.getEmail());
        }

        return amountToDeduct;
    }

    @Transactional
    public AppliedFlexDollarsResult applyFlexDollarsToTrip(Long userId, double tripCostDollars) {
        // Convert trip cost to cents (1 flex dollar = 1 cent)
        int tripCostCents = (int) Math.round(tripCostDollars * 100);

        // Get available flex dollars
        int availableFlexDollars = getAvailableFlexDollars(userId);

        // Calculate how many flex dollars to be used
        int flexDollarsToUse = Math.min(availableFlexDollars, tripCostCents);

        // Deduct flex dollars
        int actuallyDeducted = deductFlexDollars(userId, flexDollarsToUse);

        // Calculate final cost
        double finalCost = tripCostDollars - (actuallyDeducted / 100.0);

        // Ensure no negative costs
        finalCost = Math.max(0, finalCost);

        return new AppliedFlexDollarsResult(actuallyDeducted, finalCost);
    }


    public static class AppliedFlexDollarsResult {
        private final int flexDollarsUsed;
        private final double finalCostToCharge;

        public AppliedFlexDollarsResult(int flexDollarsUsed, double finalCostToCharge) {
            this.flexDollarsUsed = flexDollarsUsed;
            this.finalCostToCharge = finalCostToCharge;
        }

        public int getFlexDollarsUsed() {
            return flexDollarsUsed;
        }

        public double getFinalCostToCharge() {
            return finalCostToCharge;
        }
    }
}