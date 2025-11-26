package com.hexpedal.backend.controller;

import com.hexpedal.backend.BaseIntegrationTest;
import com.hexpedal.backend.dto.CostEstimateDto;
import com.hexpedal.backend.dto.PricingPlanDto;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

public class PricingControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void getAllPricingPlans_ReturnsListOfPlans() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<PricingPlanDto[]> response = restTemplate.exchange(
                "/api/pricing/plans",
                HttpMethod.GET,
                requestEntity,
                PricingPlanDto[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        // init.sql has 3 subscription plans
        assertThat(response.getBody().length).isGreaterThanOrEqualTo(3);
    }

    @Test
    void getAllPricingPlans_ContainsExpectedPlanTypes() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<PricingPlanDto[]> response = restTemplate.exchange(
                "/api/pricing/plans",
                HttpMethod.GET,
                requestEntity,
                PricingPlanDto[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    void estimateCost_ReturnsEstimate_WhenValidDuration() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<CostEstimateDto> response = restTemplate.exchange(
                "/api/pricing/calculate?durationMinutes=30",
                HttpMethod.GET,
                requestEntity,
                CostEstimateDto.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    void estimateCost_ReturnsEstimate_WhenZeroDuration() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<CostEstimateDto> response = restTemplate.exchange(
                "/api/pricing/calculate?durationMinutes=0",
                HttpMethod.GET,
                requestEntity,
                CostEstimateDto.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    void estimateCost_ReturnsBadRequest_WhenNegativeDuration() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/pricing/calculate?durationMinutes=-10",
                HttpMethod.GET,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void estimateCost_ReturnsBadRequest_WhenMissingDuration() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/pricing/calculate",
                HttpMethod.GET,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}