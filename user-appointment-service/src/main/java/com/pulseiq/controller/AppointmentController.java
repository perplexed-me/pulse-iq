package com.pulseiq.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pulseiq.dto.AppointmentRequestDto;
import com.pulseiq.dto.AppointmentResponseDto;
import com.pulseiq.dto.DoctorListDto;
import com.pulseiq.entity.Appointment.AppointmentStatus;
import com.pulseiq.entity.User;
import com.pulseiq.repository.UserRepository;
import com.pulseiq.security.JwtUtil;
import com.pulseiq.service.AppointmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    // Helper class to store user information
    private static class UserInfo {
        private String userId;
        private String role;

        public UserInfo(String userId, String role) {
            this.userId = userId;
            this.role = role;
        }

        public String getUserId() {
            return userId;
        }

        public String getRole() {
            return role;
        }
    }

    // Helper method to validate token and extract user info
    private UserInfo validateTokenAndExtractUserInfo(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid token format");
        }

        String token = authHeader.substring(7);
        String userId = jwtUtil.extractUsername(token); // This actually returns userId from JWT sub field

        Optional<User> userOpt = userRepository.findByUserId(userId); // Use findByUserId instead of findByUsername
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();
        // Extract role from user entity and convert ROLE_PATIENT/ROLE_DOCTOR to
        // patient/doctor
        String role = user.getRole().toString().toLowerCase();
        if (role.startsWith("role_")) {
            role = role.substring(5); // Remove "role_" prefix
        }
        return new UserInfo(user.getUserId(), role);
    }

    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody AppointmentRequestDto request) {
        try {
            UserInfo userInfo = validateTokenAndExtractUserInfo(authHeader);

            if (!"patient".equals(userInfo.getRole())) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Only patients can book appointments");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            AppointmentResponseDto appointment = appointmentService.bookAppointment(userInfo.getUserId(), request);
            return ResponseEntity.ok(appointment);

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/my-appointments")
    public ResponseEntity<?> getMyAppointments(@RequestHeader("Authorization") String authHeader) {
        try {
            UserInfo userInfo = validateTokenAndExtractUserInfo(authHeader);

            List<AppointmentResponseDto> appointments;

            if ("patient".equals(userInfo.getRole())) {
                appointments = appointmentService.getPatientAppointments(userInfo.getUserId());
            } else if ("doctor".equals(userInfo.getRole())) {
                appointments = appointmentService.getDoctorAppointments(userInfo.getUserId());
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Unauthorized role");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            return ResponseEntity.ok(appointments);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingAppointments(@RequestHeader("Authorization") String authHeader) {
        try {
            UserInfo userInfo = validateTokenAndExtractUserInfo(authHeader);

            List<AppointmentResponseDto> appointments;

            if ("patient".equals(userInfo.getRole())) {
                appointments = appointmentService.getUpcomingAppointments(userInfo.getUserId());
            } else if ("doctor".equals(userInfo.getRole())) {
                appointments = appointmentService.getUpcomingAppointments(userInfo.getUserId());
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Unauthorized role");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            return ResponseEntity.ok(appointments);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{appointmentId}/status")
    public ResponseEntity<?> updateAppointmentStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long appointmentId,
            @RequestParam AppointmentStatus status) {
        try {
            UserInfo userInfo = validateTokenAndExtractUserInfo(authHeader);

            AppointmentResponseDto appointment = appointmentService
                    .updateAppointmentStatus(appointmentId, status, userInfo.getUserId(), userInfo.getRole());

            return ResponseEntity.ok(appointment);

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{appointmentId}/cancel")
    public ResponseEntity<?> cancelAppointment(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long appointmentId,
            @RequestBody(required = false) Map<String, String> requestBody) {
        try {
            UserInfo userInfo = validateTokenAndExtractUserInfo(authHeader);

            String cancellationReason = "";
            if (requestBody != null && requestBody.containsKey("cancellationReason")) {
                cancellationReason = requestBody.get("cancellationReason");
            }

            appointmentService.cancelAppointment(appointmentId, userInfo.getUserId(), userInfo.getRole(),
                    cancellationReason);

            return ResponseEntity.noContent().build(); // Return 204 No Content for successful cancellation

        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/doctors")
    public ResponseEntity<?> getAllAvailableDoctors() {
        try {
            List<DoctorListDto> doctors = appointmentService.getAllAvailableDoctors();
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/doctors/by-specialization")
    public ResponseEntity<?> getDoctorsBySpecialization(@RequestParam String specialization) {
        try {
            List<DoctorListDto> doctors = appointmentService.getDoctorsBySpecialization(specialization);
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/specializations")
    public ResponseEntity<?> getAllSpecializations() {
        try {
            List<String> specializations = appointmentService.getAllSpecializations();
            return ResponseEntity.ok(specializations);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
