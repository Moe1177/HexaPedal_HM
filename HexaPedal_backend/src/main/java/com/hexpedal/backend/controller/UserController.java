package com.hexpedal.backend.controller;

import com.hexpedal.backend.service.UserService;
import com.hexpedal.backend.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestMapping("/users")
@RestController
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> authenticatedUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            System.out.println("Authentication: " + authentication);
            System.out.println("Principal class: " + authentication.getPrincipal().getClass().getName());
            System.out.println("Principal: " + authentication.getPrincipal());
            User currentUser = (User) authentication.getPrincipal();

            // DEBUG
            Map<String, Object> response = new HashMap<>();
            response.put("id", currentUser.getId());
            response.put("email", currentUser.getEmail());
            response.put("fullName", currentUser.getFullName());
            response.put("username", currentUser.getUsername());
            response.put("address", currentUser.getAddress());
            response.put("enabled", currentUser.isEnabled());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<User>> allUsers() {
        List<User> users = userService.allUsers();
        return ResponseEntity.ok(users);
    }
}