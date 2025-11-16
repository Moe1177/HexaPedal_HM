package com.hexpedal.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;
import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class JwtServiceTest {

    private JwtService jwtService;
    private String token;

    @BeforeEach
    public void setUp() throws Exception {
        // Spy service (optional; here mostly to override methods if needed)
        jwtService = spy(new JwtService());

        // Inject private fields
        Field secretKeyField = JwtService.class.getDeclaredField("secretKey");
        secretKeyField.setAccessible(true);
        secretKeyField.set(jwtService, "c2VjdXJlc2VjdXJlc2VjdXJlc2VjdXJlc2VjdXJlMTIzNDU2"); // 256-bit Base64 of "securesecuresecuresecure123456"

        Field expirationField = JwtService.class.getDeclaredField("jwtExpiration");
        expirationField.setAccessible(true);
        expirationField.set(jwtService, 1000L * 60); // 1 minute

        // Create a fake user
        UserDetails fakeUser = mock(UserDetails.class);
        when(fakeUser.getUsername()).thenReturn("testuser");
        when(fakeUser.getAuthorities()).thenReturn(Collections.emptyList());

        // Generate a real JWT token
        token = jwtService.generateToken(fakeUser);
    }

    @Test
    public void extractUsername_ReturnsUsername() {
        String username = jwtService.extractUsername(token);
        assertEquals("testuser", username);
    }
}
