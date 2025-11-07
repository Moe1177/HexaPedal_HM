package com.hexpedal.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hexpedal.backend.dto.BillingHistoryDTO;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.service.BillingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BillingHistoryDTO>> getBillingHistory(
            @AuthenticationPrincipal User user) {
        List<BillingHistoryDTO> history = billingService.getBillingHistory(user.getId());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/plan")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentPlan(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of(
                "plan", billingService.getUserPlan(user.getId()).name()
        ));
    }
}

