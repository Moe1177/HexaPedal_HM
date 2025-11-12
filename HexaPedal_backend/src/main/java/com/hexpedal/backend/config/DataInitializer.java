package com.hexpedal.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        System.out.println("✅ HexaPedal initialized with loyalty tier system");
        System.out.println("📊 Loyalty Tiers:");
        System.out.println("   - Bronze: 5% discount, 10min reservation hold");
        System.out.println("   - Silver: 10% discount, 12min reservation hold");
        System.out.println("   - Gold: 15% discount, 15min reservation hold");
        System.out.println("💰 Base rate: $0.01 CAD per minute");
    }
}