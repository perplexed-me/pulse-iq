package com.pulseiq.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;

import com.pulseiq.security.JwtFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${frontend.origin:http://132.196.64.104:8080}")
    private String frontendOrigin;

    @Value("${app.cors.allowed-origins:http://132.196.64.104:8080}")
    private String allowedOrigins;

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public MultipartResolver multipartResolver() {
        return new StandardServletMultipartResolver();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/auth/register/**", "/api/auth/google-patient",
                                "/api/auth/health")
                        .permitAll()
                        .requestMatchers("/api/medicines/**").permitAll() // Medicines can be accessed without auth for listing
                        .requestMatchers("/api/public/doctors").permitAll() // Public endpoint for viewing doctors
                        .requestMatchers("/api/users/**","/api/appointments/**","/api/test-results/**","/api/doctors/**","/api/prescriptions/**","/api/notifications/**").authenticated()
                        .requestMatchers("/api/auth/validate", "/api/auth/profile").authenticated()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // For Azure deployment - use environment-based origins only
        List<String> origins = new ArrayList<>();
        
        // Add frontend origin (main production URL)
        if (frontendOrigin != null && !frontendOrigin.isEmpty()) {
            origins.add(frontendOrigin);
        }

        // Add origins from comma-separated environment variable
        if (allowedOrigins != null && !allowedOrigins.isEmpty()) {
            String[] originArray = allowedOrigins.split(",");
            for (String origin : originArray) {
                String trimmedOrigin = origin.trim();
                if (!trimmedOrigin.isEmpty() && !origins.contains(trimmedOrigin)) {
                    origins.add(trimmedOrigin);
                }
            }
        }

        // Fallback: if no origins configured, allow all for Azure deployment
        if (origins.isEmpty()) {
            System.out.println("CORS Configuration - No specific origins configured, allowing all origins for Azure deployment");
            configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        } else {
            System.out.println("CORS Configuration - Allowed Origins: " + origins);
            configuration.setAllowedOrigins(origins);
        }
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"));
        configuration.setExposedHeaders(Arrays.asList(
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}