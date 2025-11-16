package com.hexpedal.backend.service;

import com.hexpedal.backend.model.*;
import com.hexpedal.backend.repository.PaymentMethodRepository;
import com.hexpedal.backend.repository.SubscriptionPlanRepository;
import com.hexpedal.backend.repository.UserRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentMethodRepository paymentMethodRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepo;

    @Mock
    private UserSubscriptionRepository userSubscriptionRepo;

    @InjectMocks
    private PaymentService paymentService;

    private User testUser;
    private SubscriptionPlan testPlan;
    private BillingAddress testBillingAddress;

    @BeforeEach
    public void setUp() {
        testUser = Rider.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test User")
                .stripeCustomerId("cus_test123")
                .build();

        testPlan = SubscriptionPlan.builder()
                .id(1L)
                .planType(PlanType.MONTHLY)
                .name("Monthly Plan")
                .stripePriceId("price_test123")
                .price(BigDecimal.valueOf(29.99))
                .build();

        testBillingAddress = BillingAddress.builder()
                .line1("123 Test St")
                .line2("QC")
                .city("Test City")
                .postalCode("H1H 1H1")
                .country("CA")
                .build();
    }

    @Test
    public void saveStripePaymentMethod_WithNewCustomer_CreatesCustomerAndSavesPaymentMethod() throws Exception {
        // Arrange
        User userWithoutStripe = Rider.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test User")
                .stripeCustomerId(null)
                .build();

        when(userRepo.findById(1L)).thenReturn(Optional.of(userWithoutStripe));
        when(userRepo.save(any(User.class))).thenReturn(userWithoutStripe);
        when(paymentMethodRepo.findByUserIdAndDefaultMethodTrue(1L)).thenReturn(Optional.empty());

        try (MockedStatic<Customer> customerMock = mockStatic(Customer.class);
             MockedStatic<PaymentMethod> pmMock = mockStatic(PaymentMethod.class)) {

            Customer mockCustomer = mock(Customer.class);
            when(mockCustomer.getId()).thenReturn("cus_new123");
            customerMock.when(() -> Customer.create(anyMap())).thenReturn(mockCustomer);

            PaymentMethod mockPm = mock(PaymentMethod.class);
            PaymentMethod.Card mockCard = mock(PaymentMethod.Card.class);
            when(mockCard.getBrand()).thenReturn("visa");
            when(mockCard.getLast4()).thenReturn("4242");
            when(mockCard.getExpMonth()).thenReturn(12L);
            when(mockCard.getExpYear()).thenReturn(2025L);
            when(mockPm.getId()).thenReturn("pm_test123");
            when(mockPm.getCard()).thenReturn(mockCard);
            when(mockPm.attach(anyMap())).thenReturn(mockPm);

            pmMock.when(() -> PaymentMethod.retrieve("pm_test123")).thenReturn(mockPm);

            Customer mockUpdatedCustomer = mock(Customer.class);
            when(mockUpdatedCustomer.update(anyMap())).thenReturn(mockUpdatedCustomer);
            customerMock.when(() -> Customer.retrieve("cus_new123")).thenReturn(mockUpdatedCustomer);

            com.hexpedal.backend.model.PaymentMethod savedPm = com.hexpedal.backend.model.PaymentMethod.builder()
                    .id(1L)
                    .user(userWithoutStripe)
                    .provider(PaymentProvider.STRIPE)
                    .type(PaymentMethodType.CARD)
                    .providerPaymentMethodId("pm_test123")
                    .cardHolderName("Test User")
                    .brand(PaymentBrand.VISA)
                    .last4("4242")
                    .expMonth(12)
                    .expYear(2025)
                    .billingAddress(testBillingAddress)
                    .defaultMethod(true)
                    .active(true)
                    .build();

            when(paymentMethodRepo.save(any(com.hexpedal.backend.model.PaymentMethod.class))).thenReturn(savedPm);

            // Act
            com.hexpedal.backend.model.PaymentMethod result = paymentService.saveStripePaymentMethod(
                    1L, "pm_test123", testBillingAddress, "Test User");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getBrand()).isEqualTo(PaymentBrand.VISA);
            assertThat(result.getLast4()).isEqualTo("4242");
            assertThat(result.isDefaultMethod()).isTrue();
            verify(userRepo).save(any(User.class));
            verify(paymentMethodRepo).save(any(com.hexpedal.backend.model.PaymentMethod.class));
        }
    }

    @Test
    public void saveStripePaymentMethod_WithExistingDefault_UnsetsOldDefault() throws Exception {
        // Arrange
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));

        com.hexpedal.backend.model.PaymentMethod oldDefault = com.hexpedal.backend.model.PaymentMethod.builder()
                .id(1L)
                .user(testUser)
                .defaultMethod(true)
                .build();

        when(paymentMethodRepo.findByUserIdAndDefaultMethodTrue(1L)).thenReturn(Optional.of(oldDefault));

        try (MockedStatic<PaymentMethod> pmMock = mockStatic(PaymentMethod.class);
             MockedStatic<Customer> customerMock = mockStatic(Customer.class)) {

            PaymentMethod mockPm = mock(PaymentMethod.class);
            PaymentMethod.Card mockCard = mock(PaymentMethod.Card.class);
            when(mockCard.getBrand()).thenReturn("mastercard");
            when(mockCard.getLast4()).thenReturn("5555");
            when(mockCard.getExpMonth()).thenReturn(6L);
            when(mockCard.getExpYear()).thenReturn(2026L);
            when(mockPm.getId()).thenReturn("pm_new123");
            when(mockPm.getCard()).thenReturn(mockCard);
            when(mockPm.attach(anyMap())).thenReturn(mockPm);

            pmMock.when(() -> PaymentMethod.retrieve("pm_new123")).thenReturn(mockPm);

            Customer mockCustomer = mock(Customer.class);
            when(mockCustomer.update(anyMap())).thenReturn(mockCustomer);
            customerMock.when(() -> Customer.retrieve("cus_test123")).thenReturn(mockCustomer);

            when(paymentMethodRepo.save(any(com.hexpedal.backend.model.PaymentMethod.class)))
                    .thenReturn(com.hexpedal.backend.model.PaymentMethod.builder().build());

            // Act
            paymentService.saveStripePaymentMethod(1L, "pm_new123", testBillingAddress, "Test User");

            // Assert
            verify(paymentMethodRepo).save(oldDefault);
            assertThat(oldDefault.isDefaultMethod()).isFalse();
        }
    }

    @Test
    public void createCheckoutSession_ReturnsCheckoutUrl() throws Exception {
        // Arrange
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));
        when(subscriptionPlanRepo.findByPlanType(PlanType.MONTHLY)).thenReturn(Optional.of(testPlan));
        when(userSubscriptionRepo.findActiveSubscriptionByUserId(1L)).thenReturn(Optional.empty());

        try (MockedStatic<Session> sessionMock = mockStatic(Session.class)) {
            Session mockSession = mock(Session.class);
            when(mockSession.getUrl()).thenReturn("https://checkout.stripe.com/session123");
            sessionMock.when(() -> Session.create(anyMap())).thenReturn(mockSession);

            // Act
            String result = paymentService.createCheckoutSession(
                    1L, PlanType.MONTHLY, "https://success.url", "https://cancel.url");

            // Assert
            assertThat(result).isEqualTo("https://checkout.stripe.com/session123");
            sessionMock.verify(() -> Session.create(anyMap()));
        }
    }

    @Test
    public void createCheckoutSession_WithExistingSubscription_CancelsOldSubscription() throws Exception {
        // Arrange
        UserSubscription existingSubscription = UserSubscription.builder()
                .id(1L)
                .user(testUser)
                .plan(testPlan)
                .stripeSubscriptionId("sub_old123")
                .status(SubscriptionStatus.ACTIVE)
                .build();

        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));
        when(subscriptionPlanRepo.findByPlanType(PlanType.MONTHLY)).thenReturn(Optional.of(testPlan));
        when(userSubscriptionRepo.findActiveSubscriptionByUserId(1L)).thenReturn(Optional.of(existingSubscription));
        when(userSubscriptionRepo.save(any(UserSubscription.class))).thenReturn(existingSubscription);

        try (MockedStatic<Session> sessionMock = mockStatic(Session.class);
             MockedStatic<Subscription> subMock = mockStatic(Subscription.class)) {

            Subscription mockStripeSubscription = mock(Subscription.class);
            when(mockStripeSubscription.cancel()).thenReturn(mockStripeSubscription);
            subMock.when(() -> Subscription.retrieve("sub_old123")).thenReturn(mockStripeSubscription);

            Session mockSession = mock(Session.class);
            when(mockSession.getUrl()).thenReturn("https://checkout.stripe.com/session123");
            sessionMock.when(() -> Session.create(anyMap())).thenReturn(mockSession);

            // Act
            String result = paymentService.createCheckoutSession(
                    1L, PlanType.MONTHLY, "https://success.url", "https://cancel.url");

            // Assert
            assertThat(result).isNotNull();
            assertThat(existingSubscription.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);
            verify(userSubscriptionRepo).save(existingSubscription);
        }
    }

    @Test
    public void createCheckoutSession_WithInvalidPlan_ThrowsException() {
        // Arrange
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));
        when(subscriptionPlanRepo.findByPlanType(PlanType.MONTHLY)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> paymentService.createCheckoutSession(
                1L, PlanType.MONTHLY, "https://success.url", "https://cancel.url"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Subscription plan not found");
    }

    @Test
    public void createSubscription_CreatesSubscriptionSuccessfully() throws Exception {
        // Arrange
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));
        when(subscriptionPlanRepo.findByPlanType(PlanType.MONTHLY)).thenReturn(Optional.of(testPlan));
        when(userSubscriptionRepo.findActiveSubscriptionByUserId(1L)).thenReturn(Optional.empty());

        try (MockedStatic<Subscription> subMock = mockStatic(Subscription.class);
             MockedStatic<PaymentMethod> pmMock = mockStatic(PaymentMethod.class);
             MockedStatic<Customer> customerMock = mockStatic(Customer.class)) {

            PaymentMethod mockPm = mock(PaymentMethod.class);
            when(mockPm.attach(anyMap())).thenReturn(mockPm);
            pmMock.when(() -> PaymentMethod.retrieve("pm_test123")).thenReturn(mockPm);

            Customer mockCustomer = mock(Customer.class);
            when(mockCustomer.update(anyMap())).thenReturn(mockCustomer);
            customerMock.when(() -> Customer.retrieve("cus_test123")).thenReturn(mockCustomer);

            Subscription mockSubscription = mock(Subscription.class);
            when(mockSubscription.getId()).thenReturn("sub_new123");
            when(mockSubscription.getStatus()).thenReturn("active");
            when(mockSubscription.getCurrentPeriodStart()).thenReturn(Instant.now().getEpochSecond());
            when(mockSubscription.getCurrentPeriodEnd()).thenReturn(Instant.now().plusSeconds(2592000).getEpochSecond());
            when(mockSubscription.getCancelAtPeriodEnd()).thenReturn(false);
            subMock.when(() -> Subscription.create(anyMap())).thenReturn(mockSubscription);

            UserSubscription savedSubscription = UserSubscription.builder()
                    .id(1L)
                    .user(testUser)
                    .plan(testPlan)
                    .stripeSubscriptionId("sub_new123")
                    .status(SubscriptionStatus.ACTIVE)
                    .build();

            when(userSubscriptionRepo.save(any(UserSubscription.class))).thenReturn(savedSubscription);

            // Act
            UserSubscription result = paymentService.createSubscription(1L, PlanType.MONTHLY, "pm_test123");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStripeSubscriptionId()).isEqualTo("sub_new123");
            assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
            verify(userSubscriptionRepo).save(any(UserSubscription.class));
        }
    }

    @Test
    public void cancelSubscription_SetsCancelAtPeriodEnd() throws Exception {
        // Arrange
        UserSubscription activeSubscription = UserSubscription.builder()
                .id(1L)
                .user(testUser)
                .plan(testPlan)
                .stripeSubscriptionId("sub_test123")
                .status(SubscriptionStatus.ACTIVE)
                .cancelAtPeriodEnd(false)
                .build();

        when(userSubscriptionRepo.findActiveSubscriptionByUserId(1L)).thenReturn(Optional.of(activeSubscription));
        when(userSubscriptionRepo.save(any(UserSubscription.class))).thenReturn(activeSubscription);

        try (MockedStatic<Subscription> subMock = mockStatic(Subscription.class)) {
            Subscription mockSubscription = mock(Subscription.class);
            when(mockSubscription.update(anyMap())).thenReturn(mockSubscription);
            subMock.when(() -> Subscription.retrieve("sub_test123")).thenReturn(mockSubscription);

            // Act
            UserSubscription result = paymentService.cancelSubscription(1L);

            // Assert
            assertThat(result.isCancelAtPeriodEnd()).isTrue();
            verify(userSubscriptionRepo).save(activeSubscription);
        }
    }

    @Test
    public void cancelSubscription_WithNoActiveSubscription_ThrowsException() {
        // Arrange
        when(userSubscriptionRepo.findActiveSubscriptionByUserId(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> paymentService.cancelSubscription(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No active subscription found");
    }

    @Test
    public void handleSubscriptionWebhook_UpdatesSubscriptionStatus() {
        // Arrange
        UserSubscription existingSubscription = UserSubscription.builder()
                .id(1L)
                .user(testUser)
                .plan(testPlan)
                .stripeSubscriptionId("sub_test123")
                .status(SubscriptionStatus.ACTIVE)
                .build();

        when(userSubscriptionRepo.findByStripeSubscriptionId("sub_test123"))
                .thenReturn(Optional.of(existingSubscription));
        when(userSubscriptionRepo.save(any(UserSubscription.class))).thenReturn(existingSubscription);

        Subscription mockStripeSubscription = mock(Subscription.class);
        when(mockStripeSubscription.getId()).thenReturn("sub_test123");
        when(mockStripeSubscription.getStatus()).thenReturn("past_due");
        when(mockStripeSubscription.getCurrentPeriodStart()).thenReturn(Instant.now().getEpochSecond());
        when(mockStripeSubscription.getCurrentPeriodEnd()).thenReturn(Instant.now().plusSeconds(2592000).getEpochSecond());
        when(mockStripeSubscription.getCancelAtPeriodEnd()).thenReturn(false);

        // Act
        paymentService.handleSubscriptionWebhook(mockStripeSubscription);

        // Assert
        assertThat(existingSubscription.getStatus()).isEqualTo(SubscriptionStatus.PAST_DUE);
        verify(userSubscriptionRepo).save(existingSubscription);
    }

    @Test
    public void chargeForTrip_CreatesPaymentIntent() throws Exception {
        // Arrange
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));

        try (MockedStatic<PaymentIntent> piMock = mockStatic(PaymentIntent.class)) {
            PaymentIntent mockPaymentIntent = mock(PaymentIntent.class);
            piMock.when(() -> PaymentIntent.create(anyMap())).thenReturn(mockPaymentIntent);

            // Act
            paymentService.chargeForTrip(1L, 15.50, "Trip charge");

            // Assert
            piMock.verify(() -> PaymentIntent.create(argThat((Map<String, Object> params) ->
                    params.get("amount").equals(1550L) &&
                            params.get("currency").equals("cad") &&
                            params.get("customer").equals("cus_test123") &&
                            params.get("description").equals("Trip charge")
            )));
        }
    }

    @Test
    public void chargeForTrip_WithNonExistentUser_ThrowsException() {
        // Arrange
        when(userRepo.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> paymentService.chargeForTrip(999L, 15.50, "Trip charge"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }
}