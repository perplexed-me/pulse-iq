package com.pulseiq.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "payment-service");
        response.put("timestamp", LocalDateTime.now());
        response.put("message", "Payment service is running");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "PulseIQ Payment Service");
        response.put("status", "Running");
        response.put("endpoints", new String[]{
            "POST /payments/initiate-direct",
            "POST /payments/create-test-payment", 
            "GET /payments/receipt/{transactionId}",
            "POST /payments/success",
            "POST /payments/fail"
        });
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }
}