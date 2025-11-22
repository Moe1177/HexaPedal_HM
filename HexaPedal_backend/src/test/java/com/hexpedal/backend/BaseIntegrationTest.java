package com.hexpedal.backend;

import com.hexpedal.backend.config.TestContainersConfiguration;
import com.hexpedal.backend.config.TestSecurityConfig;
import com.hexpedal.backend.utils.TestSecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.ArrayList;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import({ TestContainersConfiguration.class, TestSecurityConfig.class })
@TestPropertySource(properties = {
        "SUPPORT_EMAIL=test@example.com",
        "spring.mail.username=test@example.com",
        "spring.mail.password=dummy",
        "STRIPE_SECRET_KEY=dummy_secret",
        "STRIPE_WEBHOOK_SECRET=dummy_webhook",
        "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=update",
        "spring.jpa.defer-datasource-initialization=true",
        "ORS_API_KEY=dummy-test-key",
})
public abstract class BaseIntegrationTest {

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected TestSecurityUtils securityUtils;

    @BeforeEach
    void resetInterceptors() {
        restTemplate.getRestTemplate().setInterceptors(new ArrayList<>());
    }

    protected TestRestTemplate authenticated(String email) {
        // Generate token
        String token = securityUtils.generateJwtForUser(email);

        // Set authentication in SecurityContext for controller code
        securityUtils.authenticateTestUser(email);

        // Add interceptor on the underlying RestTemplate
        restTemplate.getRestTemplate().getInterceptors().add((request, body, execution) -> {
            request.getHeaders().add("Authorization", "Bearer " + token);
            return execution.execute(request, body);
        });

        return restTemplate;
    }


    protected <T> HttpEntity<T> createEntity(T body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    protected HttpEntity<Void> createEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(headers);
    }
}
