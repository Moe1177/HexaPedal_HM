package com.hexpedal.backend;

import com.hexpedal.backend.config.TestContainersConfiguration;
import com.hexpedal.backend.config.TestSecurityConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

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

    protected HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    protected <T> HttpEntity<T> createEntity(T body) {
        return new HttpEntity<>(body, createHeaders());
    }

    protected HttpEntity<Void> createEntity() {
        return new HttpEntity<>(createHeaders());
    }
}