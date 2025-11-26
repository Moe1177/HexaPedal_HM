package com.hexpedal.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;

@Configuration
@Getter
public class RoutingConfig {

    @Value("${ors.api.key:}")  // Empty string as default
    private String orsApiKey;


    @PostConstruct
    public void validateConfig() {
        if (orsApiKey == null || orsApiKey.isEmpty()) {
            System.err.println("Warning: ORS_API_KEY not configured. Routing may not work.");
        } else {
            System.out.println("ORS API Key configured successfully");
        }
    }
}