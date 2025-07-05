package com.pulseiq.controller;

import com.pulseiq.dto.*;
import com.pulseiq.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        System.out.println("=== AUTH CONTROLLER LOGIN ===");
        System.out.println("Login request received for: " + req.getIdentifier());
        try {
            Map<String, Object> response = userService.login(req);
            System.out.println("Service response received: " + response);
            
            // Check if the response contains status information (PENDING/REJECTED)
            if (response.containsKey("status")) {
                String status = (String) response.get("status");
                System.out.println("Status found in response: " + status);
                if ("PENDING".equals(status)) {
                    System.out.println("Returning HTTP 202 for PENDING status");
                    return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
                }
                if ("REJECTED".equals(status)) {
                    System.out.println("Returning HTTP 403 for REJECTED status");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }
            }
            
            System.out.println("Returning HTTP 200 for successful login");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.out.println("Exception caught: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            System.out.println("Returning HTTP 401 for exception");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }
    
    @PostMapping("/register/doctor")
    public ResponseEntity<?> registerDoctor(@Valid @RequestBody DoctorRegistrationDto dto) {
        try {
            userService.registerDoctor(dto);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Doctor registration submitted successfully. Please wait for admin approval.");
            response.put("status", "PENDING");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @PostMapping("/register/patient")
    public ResponseEntity<?> registerPatient(@Valid @RequestBody PatientRegistrationDto dto) {
        try {
            userService.registerPatient(dto);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Patient registered successfully. You can now login.");
            response.put("status", "ACTIVE");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/register/technician")
    public ResponseEntity<?> registerTechnician(@Valid @RequestBody TechnicianRegistrationDto dto) {
        try {
            userService.registerTechnician(dto);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Technician registration submitted successfully. Please wait for admin approval.");
            response.put("status", "PENDING");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @PostMapping("/google-patient")
    public ResponseEntity<?> loginWithGooglePatient(@RequestBody GoogleLoginRequest request) {
        try {
            Map<String, Object> response = userService.loginWithGoogleAsPatient(request.getIdToken());
            
            // Check if the response contains status information (PENDING/REJECTED)
            if (response.containsKey("status")) {
                String status = (String) response.get("status");
                if ("PENDING".equals(status)) {
                    return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
                }
                if ("REJECTED".equals(status)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }
            }
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // Role mismatch (already a doctor/technician/admin) or missing email
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        } catch (RuntimeException e) {
            // Invalid Google token or other authentication issues
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        } catch (Exception e) {
            // Any other internal error
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "user-appointment-service API is running");
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token format"));
            }
            
            String token = authHeader.substring(7);
            
            // If the request reaches here, it means the token passed through JwtFilter
            // But let's do an explicit validation to be sure
            String username = userService.validateTokenAndGetUsername(token);
            if (username != null) {
                return ResponseEntity.ok(Map.of("valid", true, "username", username));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token validation failed: " + e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token format"));
            }
            
            String token = authHeader.substring(7);
            Map<String, Object> profile = userService.getCurrentUserProfile(token);
            
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Failed to get profile: " + e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateCurrentUserProfile(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, Object> profileUpdate) {
        try {
            // Extract token from Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token format"));
            }
            
            String token = authHeader.substring(7);
            Map<String, Object> updatedProfile = userService.updateCurrentUserProfile(token, profileUpdate);
            
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }
}