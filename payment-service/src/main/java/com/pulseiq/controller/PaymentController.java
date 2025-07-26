package com.pulseiq.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PaymentController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Payment Service",
            "version", "1.0.0"
        ));
    }

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processPayment(@RequestBody Map<String, Object> paymentRequest) {
        // Basic payment processing logic placeholder
        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "message", "Payment processed successfully",
            "transactionId", "TXN_" + System.currentTimeMillis(),
            "amount", paymentRequest.getOrDefault("amount", 0),
            "currency", paymentRequest.getOrDefault("currency", "USD")
        ));
    }

    @GetMapping("/status/{transactionId}")
    public ResponseEntity<Map<String, Object>> getPaymentStatus(@PathVariable String transactionId) {
        return ResponseEntity.ok(Map.of(
            "transactionId", transactionId,
            "status", "COMPLETED",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
