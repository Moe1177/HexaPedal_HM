package com.hexpedal.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        System.out.println("HexaPedal initialized with bike-type pricing and loyalty tier system");
        System.out.println("");
        System.out.println("🚴 Pricing Plans:");
        System.out.println("   Standard Bike:");
        System.out.println("     - Base fee: $1.00 CAD");
        System.out.println("     - Rate: $0.02 CAD per minute");
        System.out.println("   Electric Bike:");
        System.out.println("     - Base fee: $3.00 CAD");
        System.out.println("     - Rate: $0.05 CAD per minute");
        System.out.println("");
        System.out.println("Loyalty Tiers:");
        System.out.println("   - Bronze: 5% discount, 10min reservation hold");
        System.out.println("   - Silver: 10% discount, 12min reservation hold");
        System.out.println("   - Gold: 15% discount, 15min reservation hold");
    }
}