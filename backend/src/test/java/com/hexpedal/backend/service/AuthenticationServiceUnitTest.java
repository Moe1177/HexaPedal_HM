package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.LoginUserDto;
import com.hexpedal.backend.dto.RegisterUserDto;
import com.hexpedal.backend.dto.VerifyUserDto;
import com.hexpedal.backend.model.BillingAddress;
import com.hexpedal.backend.model.Rider;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.repository.UserRepository;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthenticationServiceUnitTest {
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EmailService emailService;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthenticationService authenticationService;

    @Test
    public void signup_ReturnsSavedUser() throws Exception {
        RegisterUserDto registerUserDto = new RegisterUserDto();
        registerUserDto.setFullName("RiderTest");
        registerUserDto.setAddress("TestAddress");
        registerUserDto.setUsername("RiderTest");
        registerUserDto.setEmail("test@gmail.com");
        registerUserDto.setPassword("password");
        registerUserDto.setBillingAddress(new BillingAddress());

        Rider testRider = Rider.builder().
                id(1L).
                username("RiderTest").
                address("TestAddress").
                email("test@gmail.com").
                fullName("RiderTest").
                password("password").
                enabled(true).
                verificationCode("123456").
                stripeCustomerId("123").
                build();

        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("RiderTest")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(Mockito.any(Rider.class))).thenReturn(testRider);

        User result = authenticationService.signup(registerUserDto);

        Assertions.assertThat(result.getId()).isEqualTo(testRider.getId());
        Assertions.assertThat(result.getUsername()).isEqualTo(testRider.getUsername());
        Assertions.assertThat(result.getPassword()).isEqualTo(testRider.getPassword());

        // Check if the sendVerificationEmail functionality has been called with the proper args
        verify(emailService).sendVerificationEmail(
                eq("test@gmail.com"),
                eq("HexaPedal Account Verification"),
                contains("Verification Code: 123456")
        );
    }

    @Test
    public void authenticate_ReturnsSavedUser() {
        LoginUserDto loginUserDto = new LoginUserDto();
        loginUserDto.setEmail("test@gmail.com");
        loginUserDto.setPassword("password");

        Rider testUser = Rider.builder()
                .id(1L)
                .email("test@gmail.com")
                .username("RiderTest")
                .password("encodedPassword")
                .enabled(true)
                .build();

        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(Mockito.any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);

        User result = authenticationService.authenticate(loginUserDto);

        Assertions.assertThat(result).isEqualTo(testUser);
        verify(authenticationManager).authenticate(Mockito.any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    public void verifyUser_ReturnsNotSavedUser() {
        User user = User.builder().
                email("test@gmail.com").
                password("password").
                verificationCode("123456").
                verificationCodeExpiresAt(LocalDateTime.now().plusDays(1)).
                build();

        VerifyUserDto verifyUserDto = new VerifyUserDto();
        verifyUserDto.setEmail(user.getEmail());
        verifyUserDto.setVerificationCode(user.getVerificationCode());

        when(userRepository.findByEmail(verifyUserDto.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.save(Mockito.any(User.class))).thenReturn(user);

        authenticationService.verifyUser(verifyUserDto);

        Assertions.assertThat(user.isEnabled()).isTrue();
        Assertions.assertThat(user.getVerificationCode()).isNull();
        Assertions.assertThat(user.getVerificationCodeExpiresAt()).isNull();
    }
}
