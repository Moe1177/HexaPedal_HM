package com.hexpedal.backend.service;

import com.hexpedal.backend.model.BillingAddress;
import com.hexpedal.backend.model.PaymentMethod;
import com.hexpedal.backend.model.Rider;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDateTime;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class GuestSessionService {

    private final UserRepository userRepository;
    private final PaymentService paymentService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final LoyaltyService loyaltyService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public GuestSessionResponse createGuestSession(String paymentMethodId, BillingAddress billingAddress, String cardholderName) throws Exception {
        String guestUuid = UUID.randomUUID().toString();
        String guestEmail = generateUniqueGuestEmail();
        String guestUsername = generateUniqueGuestUsername();
        String guestPassword = UUID.randomUUID().toString();

        Rider guestUser = Rider.builder()
                .fullName("Guest User")
                .address("Temporary")
                .username(guestUsername)
                .email(guestEmail)
                .password(passwordEncoder.encode(guestPassword))
                .enabled(true) 
                .isGuest(true)
                .flexDollars(0)
                .build();

        User savedGuest = userRepository.saveAndFlush(guestUser);

        PaymentMethod paymentMethod = paymentService.saveStripePaymentMethod(
                savedGuest.getId(),
                paymentMethodId,
                billingAddress,
                cardholderName
        );

        String token = jwtService.generateToken(savedGuest);

        return new GuestSessionResponse(
                savedGuest.getId(),
                token,
                jwtService.getExpirationTime(),
                guestEmail
        );
    }

    private String generateUniqueGuestEmail() {
        String guestEmail;
        int maxAttempts = 10;
        int attempts = 0;

        do {
            if (attempts >= maxAttempts) {
                throw new RuntimeException("Failed to generate unique guest email after " + maxAttempts + " attempts");
            }
            String guestUuid = UUID.randomUUID().toString();
            guestEmail = "guest_" + guestUuid + "@hexapedal.temp";
            attempts++;
        } while (userRepository.findByEmail(guestEmail).isPresent());

        return guestEmail;
    }

    private String generateUniqueGuestUsername() {
        String guestUsername;
        int maxAttempts = 10;
        int attempts = 0;

        do {
            if (attempts >= maxAttempts) {
                throw new RuntimeException("Failed to generate unique guest username after " + maxAttempts + " attempts");
            }
            String guestUuid = UUID.randomUUID().toString();
            guestUsername = "guest_" + guestUuid.substring(0, 8);
            attempts++;
        } while (userRepository.findByUsername(guestUsername).isPresent());

        return guestUsername;
    }

    @Transactional
    public ConversionResponse convertGuestToRegisteredUser(Long guestUserId, String fullName, String email, String username, String password) throws Exception {
        User guestUser = userRepository.findById(guestUserId)
                .orElseThrow(() -> new RuntimeException("Guest user not found"));

        // Verify this is actually a guest user
        if (guestUser.getIsGuest() == null || !guestUser.getIsGuest()) {
            throw new IllegalStateException("User is not a guest user");
        }

        // Check if email or username already exists
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already in use");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already in use");
        }

        // Update user information
        guestUser.setIsGuest(false);
        guestUser.setFullName(fullName);
        guestUser.setEmail(email);
        guestUser.setUsername(username);
        guestUser.setPassword(passwordEncoder.encode(password));
        guestUser.setEnabled(false); 
        
        
        guestUser.setVerificationCode(generateVerificationCode());
        guestUser.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15));

        User convertedUser = userRepository.save(guestUser);
        
        // Initialize loyalty record for the converted user
        try {
            loyaltyService.getOrCreateLoyalty(convertedUser);
        } catch (Exception e) {
            // Log error but don't fail conversion
        }
        
        try {
            sendVerificationEmail(convertedUser);
        } catch (Exception e) {
            // Log error but don't fail conversion
        }

        // Don't generate token - user must verify email first
        // Frontend will handle showing verification code input
        return new ConversionResponse(
                convertedUser.getId(),
                null, // No token until email is verified
                null,
                email,
                "Account created successfully! Please check your email for the verification code."
        );
    }

    @Transactional
    public void archiveGuestUser(Long guestUserId) {
        User guestUser = userRepository.findById(guestUserId).orElse(null);
        
        if (guestUser != null && guestUser.getIsGuest() != null && guestUser.getIsGuest()) {
            guestUser.setEnabled(false);
            userRepository.save(guestUser);
        }
    }

   
    public boolean isGuestUser(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getIsGuest() != null && user.getIsGuest())
                .orElse(false);
    }

    private String generateVerificationCode() {
        return String.valueOf(100000 + (int) (Math.random() * 900000));
    }

    private void sendVerificationEmail(User user) {
        String subject = "HexaPedal Account Verification";
        String text = "Dear " + user.getFullName() + ",\n\n"
                + "Thank you for creating an account with HexaPedal! Please use the following verification code to activate your account:\n\n"
                + "Verification Code: " + user.getVerificationCode() + "\n\n"
                + "This code will expire in 15 minutes.\n\n"
                + "Best regards,\n"
                + "The HexaPedal Team";
        try {
            emailService.sendVerificationEmail(user.getEmail(), subject, text);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    public record GuestSessionResponse(
            Long userId,
            String token,
            Long expiresIn,
            String guestEmail
    ) {}

    public record ConversionResponse(
            Long userId,
            String token, // null if verification required
            Long expiresIn, // null if verification required
            String email,
            String message
    ) {}
}

