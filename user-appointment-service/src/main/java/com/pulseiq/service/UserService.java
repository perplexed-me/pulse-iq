package com.pulseiq.service;

import com.google.firebase.auth.FirebaseAuthException;
import com.pulseiq.dto.*;

import java.util.Map;

public interface UserService {
//    void register(RegisterRequest request);
    Map<String, Object> login(LoginRequest request);
    Map<String, Object> loginWithGoogleAsPatient(String id) throws FirebaseAuthException;
    void registerDoctor(DoctorRegistrationDto dto);
    void registerPatient(PatientRegistrationDto dto);
    void registerTechnician(TechnicianRegistrationDto dto);

    // Admin approval methods
    void approveUser(String userId);
    void rejectUser(String userId);

    // Validate token and return username if valid
    String validateTokenAndGetUsername(String token);
    
    // Get current user profile
    Map<String, Object> getCurrentUserProfile(String token);
    
    // Update current user profile
    Map<String, Object> updateCurrentUserProfile(String token, Map<String, Object> profileUpdate);
}
