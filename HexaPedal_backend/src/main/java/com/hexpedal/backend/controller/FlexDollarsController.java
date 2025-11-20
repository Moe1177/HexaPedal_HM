package com.hexpedal.backend.controller;

import com.hexpedal.backend.model.Rider;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.service.FlexDollarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/flex-dollars")
public class FlexDollarsController {

    @Autowired
    private FlexDollarService flexdollarservice;

    @PostMapping("/{id}/add-flex")
    public User addFlexDollars(@PathVariable Long id,@RequestParam int amount){
        return flexdollarservice.addFlexDollars(id,amount);
    }

    @GetMapping("/balance")
    public ResponseEntity<?> getFlexDollarsBalance(@AuthenticationPrincipal User user) {
        int balance = flexdollarservice.getAvailableFlexDollars(user.getId());
        return ResponseEntity.ok(new FlexDollarsBalanceResponse(balance));
    }

    private record FlexDollarsBalanceResponse(int balance) {}
}
