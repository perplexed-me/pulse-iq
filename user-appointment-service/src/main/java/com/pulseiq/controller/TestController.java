package com.pulseiq.controller;

import com.pulseiq.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TestController {

    private final EmailService emailService;

    /**
     * Test endpoint to verify email functionality
     */
    @PostMapping("/send-test-email")
    public ResponseEntity<?> sendTestEmail(@RequestParam String email) {
        try {
            log.info("Testing email send to: {}", email);
            emailService.sendTestEmail(email);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Test email sent successfully to " + email);
            response.put("status", "success");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to send test email", e);
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to send test email: " + e.getMessage());
            errorResponse.put("status", "failed");
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Test endpoint to verify OTP email functionality
     */
    @PostMapping("/send-test-otp")
    public ResponseEntity<?> sendTestOtp(@RequestParam String email, 
                                        @RequestParam(defaultValue = "Test Patient") String name) {
        try {
            log.info("Testing OTP email send to: {}", email);
            String testOtp = "123456";
            emailService.sendOtpEmail(email, name, testOtp);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Test OTP email sent successfully to " + email);
            response.put("otp", testOtp);
            response.put("status", "success");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to send test OTP email", e);
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to send test OTP email: " + e.getMessage());
            errorResponse.put("status", "failed");
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
