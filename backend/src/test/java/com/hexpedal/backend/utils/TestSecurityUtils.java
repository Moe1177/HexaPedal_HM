package com.hexpedal.backend.utils;

import com.hexpedal.backend.service.JwtService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
public class TestSecurityUtils {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public TestSecurityUtils(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    // Generate a JWT for a test user by email
    public String generateJwtForUser(String email) {
        UserDetails user = userDetailsService.loadUserByUsername(email);
        return jwtService.generateToken(user);
    }

    // Authenticate a test user in the SecurityContext for integration tests
    public void authenticateTestUser(String email) {
        UserDetails user = userDetailsService.loadUserByUsername(email);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        user.getAuthorities()
                );

        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
