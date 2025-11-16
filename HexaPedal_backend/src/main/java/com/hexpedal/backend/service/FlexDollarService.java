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

    /**
     * Get available flex dollars for a user
     * @param userId The user ID
     * @return The number of flex dollars available
     */
    public int getAvailableFlexDollars(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Integer flexDollars = user.getFlexDollars();
        return flexDollars != null ? flexDollars : 0;
    }

    /**
     * Deduct flex dollars from a user
     * @param userId The user ID
     * @param amount The amount to deduct
     * @return The actual amount deducted (may be less than requested if insufficient balance)
     */
    @Transactional
    public int deductFlexDollars(Long userId, int amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Integer currentFlexDollars = user.getFlexDollars();
        if (currentFlexDollars == null) {
            currentFlexDollars = 0;
        }

        // Deduct only what's available
        int amountToDeduct = Math.min(amount, currentFlexDollars);
        user.setFlexDollars(currentFlexDollars - amountToDeduct);
        userRepository.save(user);

        if (amountToDeduct > 0) {
            System.out.println("💰 Deducted " + amountToDeduct + " flex dollars from " + user.getEmail());
        }

        return amountToDeduct;
    }

    /**
     * Apply flex dollars to a trip cost and return the final amount to charge
     * @param userId The user ID
     * @param tripCostDollars The trip cost in dollars (e.g., 2.50 for $2.50)
     * @return AppliedFlexDollarsResult containing flex dollars used and final cost to charge
     */
    @Transactional
    public AppliedFlexDollarsResult applyFlexDollarsToTrip(Long userId, double tripCostDollars) {
        // Convert trip cost to cents (1 flex dollar = 1 cent)
        int tripCostCents = (int) Math.round(tripCostDollars * 100);

        // Get available flex dollars
        int availableFlexDollars = getAvailableFlexDollars(userId);

        // Calculate how many flex dollars to use (minimum of available and needed)
        int flexDollarsToUse = Math.min(availableFlexDollars, tripCostCents);

        // Deduct the flex dollars
        int actuallyDeducted = deductFlexDollars(userId, flexDollarsToUse);

        // Calculate final cost to charge
        double finalCost = tripCostDollars - (actuallyDeducted / 100.0);

        // Ensure no negative costs due to rounding
        finalCost = Math.max(0, finalCost);

        return new AppliedFlexDollarsResult(actuallyDeducted, finalCost);
    }

    /**
     * Result of applying flex dollars to a trip
     */
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