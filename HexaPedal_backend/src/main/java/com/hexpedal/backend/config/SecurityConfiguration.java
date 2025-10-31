package com.hexpedal.backend.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity

public class SecurityConfiguration {

    private final AuthenticationProvider authenticationProvider;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfiguration(AuthenticationProvider authenticationProvider,
                                 JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.authenticationProvider = authenticationProvider;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex.authenticationEntryPoint((req, res, ex2) -> {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            }))
            .authorizeHttpRequests(auth -> auth
       
                .requestMatchers("/auth/**").permitAll()

                .requestMatchers("/api/reservations/**", "/api/trips/**")
                    .hasAnyRole("RIDER", "OPERATOR")


                .requestMatchers(HttpMethod.POST, "/api/docks/*/*/bike/*")
                    .hasAnyRole("RIDER", "OPERATOR")

                // optional: public reads
                .requestMatchers(HttpMethod.GET, "/api/stations/**", "/api/bikes/**", "/api/docks/**")
                    .permitAll()

              
                .requestMatchers(HttpMethod.POST,   "/api/stations/**", "/api/bikes/**", "/api/docks/**")
                    .hasRole("OPERATOR")
                .requestMatchers(HttpMethod.PUT,    "/api/stations/**", "/api/bikes/**", "/api/docks/**")
                    .hasRole("OPERATOR")
                .requestMatchers(HttpMethod.PATCH,  "/api/stations/**", "/api/bikes/**", "/api/docks/**")
                    .hasRole("OPERATOR")
                .requestMatchers(HttpMethod.DELETE, "/api/stations/**", "/api/bikes/**", "/api/docks/**")
                    .hasRole("OPERATOR")

             
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Adjust allowed origins as needed for your frontend
        configuration.setAllowedOrigins(List.of("http://localhost:8080"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
