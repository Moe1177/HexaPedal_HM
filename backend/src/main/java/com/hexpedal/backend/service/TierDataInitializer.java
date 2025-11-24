//package com.hexpedal.backend.service;
//
//import com.hexpedal.backend.model.Tier;
//import com.hexpedal.backend.repository.TierRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.stereotype.Component;
//
//import java.math.BigDecimal;
//
//@Component
//@RequiredArgsConstructor
//@Slf4j
//public class TierDataInitializer implements CommandLineRunner {
//
//    private final TierRepository tierRepository;
//
//    @Override
//    public void run(String... args) {
//        // Only initialize if tiers table is empty
//        if (tierRepository.count() == 0) {
//            log.info("Initializing tier data...");
//            initializeTiers();
//            log.info("Tier data initialized successfully");
//        } else {
//            log.info("Tiers already exist, skipping initialization");
//        }
//    }
//
//    private void initializeTiers() {
//        // NONE Tier
//        Tier noneTier = new Tier();
//        noneTier.setName("NONE");
//        noneTier.setRank(0);
//        noneTier.setDiscountRate(new BigDecimal("0.00"));
//        noneTier.setExtraReservationMinutes(0);
//        noneTier.setDescription("Default tier with no perks. All new riders start here.");
//        noneTier.setRequirementsJson("{\"requirements\": \"None\"}");
//        noneTier.setActive(true);
//        tierRepository.save(noneTier);
//
//        // BRONZE Tier
//        Tier bronzeTier = new Tier();
//        bronzeTier.setName("BRONZE");
//        bronzeTier.setRank(1);
//        bronzeTier.setDiscountRate(new BigDecimal("0.05"));
//        bronzeTier.setExtraReservationMinutes(0);
//        bronzeTier.setDescription("Bronze tier with 5% discount on all trips.");
//        bronzeTier.setRequirementsJson(
//                "{\"requirements\": [" +
//                        "\"No missed reservations in last year\", " +
//                        "\"100% bike return rate (lifetime)\", " +
//                        "\"10+ trips in last year\"" +
//                        "]}"
//        );
//        bronzeTier.setActive(true);
//        tierRepository.save(bronzeTier);
//
//        // SILVER Tier
//        Tier silverTier = new Tier();
//        silverTier.setName("SILVER");
//        silverTier.setRank(2);
//        silverTier.setDiscountRate(new BigDecimal("0.10"));
//        silverTier.setExtraReservationMinutes(2);
//        silverTier.setDescription("Silver tier with 10% discount and extra 2-minute reservation hold.");
//        silverTier.setRequirementsJson(
//                "{\"requirements\": [" +
//                        "\"All Bronze requirements\", " +
//                        "\"5+ claimed reservations in last year\", " +
//                        "\"5+ trips per month for last 3 months\"" +
//                        "]}"
//        );
//        silverTier.setActive(true);
//        tierRepository.save(silverTier);
//
//        // GOLD Tier
//        Tier goldTier = new Tier();
//        goldTier.setName("GOLD");
//        goldTier.setRank(3);
//        goldTier.setDiscountRate(new BigDecimal("0.15"));
//        goldTier.setExtraReservationMinutes(5);
//        goldTier.setDescription("Gold tier with 15% discount and extra 5-minute reservation hold.");
//        goldTier.setRequirementsJson(
//                "{\"requirements\": [" +
//                        "\"All Silver requirements\", " +
//                        "\"5+ trips per week for last 12 weeks\"" +
//                        "]}"
//        );
//        goldTier.setActive(true);
//        tierRepository.save(goldTier);
//
//        log.info("Created tiers: NONE, BRONZE, SILVER, GOLD");
//    }
//}