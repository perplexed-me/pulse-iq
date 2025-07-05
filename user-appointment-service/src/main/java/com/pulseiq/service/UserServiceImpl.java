package com.pulseiq.service;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.pulseiq.dto.DoctorRegistrationDto;
import com.pulseiq.dto.LoginRequest;
import com.pulseiq.dto.PatientRegistrationDto;
import com.pulseiq.dto.RegisterRequest;
import com.pulseiq.dto.TechnicianRegistrationDto;
import com.pulseiq.entity.Doctor;
import com.pulseiq.entity.Patient;
import com.pulseiq.entity.RegistrationData;
import com.pulseiq.entity.Technician;
import com.pulseiq.entity.User;
import com.pulseiq.entity.UserRole;
import com.pulseiq.entity.UserStatus;
import com.pulseiq.repository.DoctorRepository;
import com.pulseiq.repository.PatientRepository;
import com.pulseiq.repository.RegistrationDataRepository;
import com.pulseiq.repository.TechnicianRepository;
import com.pulseiq.repository.UserRepository;
import com.pulseiq.security.JwtUtil;
import com.pulseiq.security.UserDetailsServiceImpl;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepository repo;
    @Autowired
    private DoctorRepository doctorRepo;
    @Autowired
    private PatientRepository patientRepo;
    @Autowired
    private TechnicianRepository technicianRepo;
    @Autowired
    private PasswordEncoder encoder;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private RegistrationDataRepository registrationDataRepo;
    @Autowired
    private ObjectMapper objectMapper; // Add to your dependencies

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank())
            return null;
        phone = phone.trim();
        if (phone.matches("^01\\d{9}$")) {
            return "+88" + phone;
        } else if (phone.matches("^\\+8801\\d{9}$")) {
            return phone;
        } else {
            throw new IllegalArgumentException("Invalid Bangladeshi phone number format.");
        }
    }

    private String generateUserId(String prefix) {
        String yearMonth = new SimpleDateFormat("yyyyMM").format(new Date());
        String pattern = prefix + yearMonth;

        Optional<User> lastUser = repo.findTopByUserIdStartingWithOrderByUserIdDesc(pattern);

        int sequence = 1;
        if (lastUser.isPresent()) {
            String lastId = lastUser.get().getUserId();
            String lastSeq = lastId.substring(pattern.length());
            sequence = Integer.parseInt(lastSeq) + 1;
        }

        return pattern + String.format("%03d", sequence);
    }

    // CORRECTED: Only create User entity, don't create profile tables yet
    private String createAndSaveUserOnly(RegisterRequest dto, UserRole role, UserStatus status, String userIdPrefix) {
        String userId = generateUserId(userIdPrefix);

        String normalizedEmail = dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : null;
        String normalizedPhone = normalizePhone(dto.getPhone());

        if (normalizedEmail == null && normalizedPhone == null) {
            throw new RuntimeException("Either email or phone must be provided.");
        }

        // Check for existing email BEFORE trying to save
        if (normalizedEmail != null) {
            Optional<User> existingEmailUser = repo.findByEmailIgnoreCase(normalizedEmail);
            if (existingEmailUser.isPresent()) {
                throw new RuntimeException("Email " + normalizedEmail
                        + " is already registered. Please use a different email or try logging in.");
            }
        }

        // Check for existing phone BEFORE trying to save
        if (normalizedPhone != null) {
            Optional<User> existingPhoneUser = repo.findByPhone(normalizedPhone);
            if (existingPhoneUser.isPresent()) {
                throw new RuntimeException("Phone number " + normalizedPhone
                        + " is already registered. Please use a different phone number or try logging in.");
            }
        }

        User user = new User();
        user.setUserId(userId);
        user.setUsername(normalizedEmail != null ? normalizedEmail : normalizedPhone);
        user.setEmail(normalizedEmail);
        user.setPhone(normalizedPhone);
        user.setPassword(encoder.encode(dto.getPassword()));
        user.setRole(role);
        user.setStatus(status);

        try {
            repo.save(user);
            return userId;
        } catch (Exception e) {
            String errorMessage = e.getMessage();

            // Handle duplicate email constraint
            if (errorMessage.contains("UK6j5t70rd2eub907qysjvd76n") ||
                    errorMessage.contains("duplicate key value") && errorMessage.contains("email")) {
                throw new RuntimeException("Email " + normalizedEmail
                        + " is already registered. Please use a different email or try logging in.");
            }

            // Handle duplicate phone constraint
            if (errorMessage.contains("UKassj8wlmlev8obxew6ql3vtmt") ||
                    errorMessage.contains("duplicate key value") && errorMessage.contains("phone")) {
                throw new RuntimeException("Phone number " + normalizedPhone
                        + " is already registered. Please use a different phone number or try logging in.");
            }

            // Handle any other database constraint violations
            if (errorMessage.contains("duplicate key value")) {
                throw new RuntimeException(
                        "The provided information is already registered. Please check your email and phone number.");
            }

            // For any other unexpected errors
            throw new RuntimeException("Registration failed. Please try again.");
        }
    }

    // UPDATED: Store registration data properly
    private void storeRegistrationData(String userId, Object registrationDto, UserRole role) {
        try {
            String jsonData = objectMapper.writeValueAsString(registrationDto);
            RegistrationData regData = new RegistrationData(userId, jsonData, role);
            registrationDataRepo.save(regData);
            System.out.println("Successfully stored registration data for user: " + userId);
        } catch (Exception e) {
            System.err.println("Failed to store registration data for user: " + userId);
            throw new RuntimeException("Failed to store registration data", e);
        }
    }

    // NEW: Retrieve registration data
    private Object getRegistrationData(String userId, UserRole role) {
        Optional<RegistrationData> regDataOpt = registrationDataRepo.findByUserId(userId);
        if (!regDataOpt.isPresent()) {
            throw new RuntimeException("Registration data not found for user: " + userId);
        }

        try {
            String jsonData = regDataOpt.get().getRegistrationJson();
            switch (role) {
                case DOCTOR:
                    return objectMapper.readValue(jsonData, DoctorRegistrationDto.class);
                case TECHNICIAN:
                    return objectMapper.readValue(jsonData, TechnicianRegistrationDto.class);
                case PATIENT:
                    return objectMapper.readValue(jsonData, PatientRegistrationDto.class);
                default:
                    throw new RuntimeException("Unsupported role: " + role);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve registration data for user: " + userId, e);
        }
    }

    // CORRECTED: Registration methods now only create User, not profile tables
    public void registerDoctor(DoctorRegistrationDto dto) {
        // Validate that license number is unique before creating user
        if (doctorRepo.existsByLicenseNumber(dto.getLicenseNumber())) {
            throw new RuntimeException(
                    "License number " + dto.getLicenseNumber() + " is already registered to another doctor.");
        }

        String userId = createAndSaveUserOnly(dto, UserRole.DOCTOR, UserStatus.PENDING, "D");
        storeRegistrationData(userId, dto, UserRole.DOCTOR);
        // Profile will be created only after admin approval
    }

    public void registerPatient(PatientRegistrationDto dto) {
        String userId = createAndSaveUserOnly(dto, UserRole.PATIENT, UserStatus.ACTIVE, "P"); // Patient auto-approved
        createPatientProfile(userId, dto); // Create profile immediately for patients
    }

    public void registerTechnician(TechnicianRegistrationDto dto) {
        String userId = createAndSaveUserOnly(dto, UserRole.TECHNICIAN, UserStatus.PENDING, "T");
        storeRegistrationData(userId, dto, UserRole.TECHNICIAN);
        // Profile will be created only after admin approval
    }

    @Transactional
    public void approveUser(String userId) {
        System.out.println("=== APPROVAL DEBUG START ===");
        System.out.println("Approving user: " + userId);

        try {
            // Fetch the user from the database
            Optional<User> optUser = repo.findByUserIdIgnoreCase(userId);
            if (!optUser.isPresent()) {
                System.out.println("ERROR: User not found: " + userId);
                throw new RuntimeException("User not found: " + userId);
            }

            User user = optUser.get();
            System.out.println("Found user with status: " + user.getStatus());
            System.out.println("User role: " + user.getRole());

            // Prevent approving users who are already active
            if (user.getStatus() == UserStatus.ACTIVE) {
                throw new RuntimeException("User is already approved and active.");
            }

            // Only allow approval from PENDING or REJECTED status
            if (user.getStatus() != UserStatus.PENDING && user.getStatus() != UserStatus.REJECTED) {
                System.out.println("ERROR: Cannot approve user with status: " + user.getStatus());
                throw new RuntimeException("User cannot be approved from status: " + user.getStatus());
            }

            // 1) First, update the user status to ACTIVE
            user.setStatus(UserStatus.ACTIVE);
            repo.save(user);
            System.out.println("User status updated to ACTIVE");

            // 2) Try to retrieve registration data for profile creation
            Optional<RegistrationData> maybeData = registrationDataRepo.findByUserId(userId);
            if (maybeData.isPresent()) {
                // Registration data exists, so we proceed to create the profile
                String json = maybeData.get().getRegistrationJson();
                switch (user.getRole()) {
                    case DOCTOR:
                        DoctorRegistrationDto dr = objectMapper.readValue(json, DoctorRegistrationDto.class);
                        createDoctorProfile(userId, dr); // Creating the doctor profile
                        System.out.println("Doctor profile created");
                        break;
                    case TECHNICIAN:
                        TechnicianRegistrationDto tr = objectMapper.readValue(json, TechnicianRegistrationDto.class);
                        createTechnicianProfile(userId, tr); // Creating the technician profile
                        System.out.println("Technician profile created");
                        break;
                    case PATIENT:
                        // Patients are auto-approved so we won't hit this case during approval
                        System.out.println("Patients do not require approval here.");
                        break;
                    default:
                        System.out.println("Unsupported role for profile creation: " + user.getRole());
                        break;
                }

                // Clean up the registration data after successful profile creation
                registrationDataRepo.deleteByUserId(userId);
                System.out.println("Registration data cleaned up");
            } else {
                // If registration data is missing, log a warning but do not stop the process
                System.out.println("Warning: No registration data found for user: " + userId);
            }

            System.out.println("=== APPROVAL SUCCESS ===");

        } catch (Exception e) {
            System.err.println("=== APPROVAL FAILED ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to approve user: " + e.getMessage(), e);
        }
    }

    public void rejectUser(String userId) {
        Optional<User> optUser = repo.findByUserIdIgnoreCase(userId);
        if (!optUser.isPresent()) {
            throw new RuntimeException("User not found");
        }

        User user = optUser.get();

        // Prevent rejecting already active users
        // if (user.getStatus() == UserStatus.ACTIVE) {
        // throw new RuntimeException("Cannot reject an active user.You may need to
        // deactivate the user first.");
        // }

        // Allow rejection from PENDING status, or re-rejection if needed
        if (user.getStatus() == UserStatus.REJECTED) {
            System.out.println("User is already rejected, no action needed");
            return; // Or throw exception if you don't want to allow this
        }

        user.setStatus(UserStatus.REJECTED);
        repo.save(user);

        System.out.println("User " + userId + " has been rejected");
    }

    // Helper method to check if profile exists
    private boolean checkIfProfileExists(String userId, UserRole role) {
        switch (role) {
            case DOCTOR:
                return doctorRepo.findById(userId).isPresent();
            case TECHNICIAN:
                return technicianRepo.findById(userId).isPresent();
            case PATIENT:
                return patientRepo.findById(userId).isPresent();
            default:
                return false;
        }
    }

    private void createDoctorProfile(String userId, DoctorRegistrationDto req) {
        // Check if doctor profile already exists
        if (doctorRepo.existsByDoctorId(userId)) {
            System.out.println("Doctor profile already exists for user: " + userId);
            return;
        }

        // Check if license number is already in use by another doctor
        if (doctorRepo.existsByLicenseNumber(req.getLicenseNumber())) {
            System.out.println("License number already exists: " + req.getLicenseNumber());
            throw new RuntimeException(
                    "License number " + req.getLicenseNumber() + " is already registered to another doctor.");
        }

        Doctor doctor = new Doctor();
        doctor.setDoctorId(userId);
        doctor.setFirstName(req.getFirstName());
        doctor.setLastName(req.getLastName());
        doctor.setSpecialization(req.getSpecialization());
        doctor.setDegree(req.getDegree());
        doctor.setLicenseNumber(req.getLicenseNumber());
        doctor.setAssistantName(req.getAssistantName());
        doctor.setAssistantNumber(req.getAssistantNumber());
        doctor.setConsultationFee(
                req.getConsultationFee() != null ? new BigDecimal(req.getConsultationFee()) : BigDecimal.ZERO);
        doctorRepo.save(doctor);
        System.out.println("Doctor profile successfully created for user: " + userId);
    }

    private void createPatientProfile(String userId, PatientRegistrationDto dto) {
        Patient patient = new Patient();
        patient.setPatientId(userId);
        patient.setFirstName(dto.getFirstName());
        patient.setLastName(dto.getLastName());
        patient.setAge(dto.getAge());
        patient.setGender(dto.getGender());
        patient.setBloodGroup(dto.getBloodGroup());
        patient.setRegistrationDate(LocalDateTime.now());

        patientRepo.save(patient);
    }

    private void createTechnicianProfile(String userId, TechnicianRegistrationDto dto) {
        // Check if technician profile already exists
        if (technicianRepo.existsByTechnicianId(userId)) {
            System.out.println("Technician profile already exists for user: " + userId);
            return;
        }

        Technician technician = new Technician();
        technician.setTechnicianId(userId);
        technician.setFirstName(dto.getFirstName());
        technician.setLastName(dto.getLastName());
        technician.setSpecialization(dto.getSpecialization());

        technicianRepo.save(technician);
        System.out.println("Technician profile successfully created for user: " + userId);
    }

    // private User findUserByIdentifier(String identifier) {
    // Optional<User> optionalUser = Optional.empty();

    // if (identifier.matches("^(?i)[dptn]\\d+$")) { // Added 'n' for admin if
    // needed
    // optionalUser = repo.findByUserIdIgnoreCase(identifier);
    // } else if (identifier.matches("^\\d{11}$") ||
    // identifier.matches("^\\+8801\\d{9}$")) {
    // if (identifier.startsWith("01")) {
    // identifier = "+88" + identifier;
    // }
    // optionalUser = repo.findByPhone(identifier);
    // } else if (identifier.contains("@")) {
    // optionalUser = repo.findByEmailIgnoreCase(identifier.toLowerCase());
    // }

    // return optionalUser.orElseThrow(() -> new RuntimeException("User not
    // found."));
    // }

    private User findUserByIdentifier(String identifier) {
        System.out.println("=== SEARCHING FOR USER ===");
        System.out.println("Original identifier: '" + identifier + "'");

        // Normalize the identifier first
        String normalizedIdentifier = identifier.trim();
        System.out.println("Trimmed identifier: '" + normalizedIdentifier + "'");

        Optional<User> optionalUser = Optional.empty();

        if (normalizedIdentifier.matches("^(?i)[dpta]\\d+$")) {
            System.out.println("Searching by User ID pattern");
            optionalUser = repo.findByUserIdIgnoreCase(normalizedIdentifier);
        } else if (normalizedIdentifier.matches("^\\d{11}$") || normalizedIdentifier.matches("^\\+8801\\d{9}$")) {
            System.out.println("Searching by phone pattern");
            if (normalizedIdentifier.startsWith("01")) {
                normalizedIdentifier = "+88" + normalizedIdentifier;
            }
            System.out.println("Normalized phone: '" + normalizedIdentifier + "'");
            optionalUser = repo.findByPhone(normalizedIdentifier);
        } else if (normalizedIdentifier.contains("@")) {
            System.out.println("Searching by email pattern");
            String normalizedEmail = normalizedIdentifier.toLowerCase();
            System.out.println("Normalized email: '" + normalizedEmail + "'");
            optionalUser = repo.findByEmailIgnoreCase(normalizedEmail);
        } else {
            System.out.println("No pattern matched for identifier: '" + normalizedIdentifier + "'");
        }

        System.out.println("User found: " + optionalUser.isPresent());
        if (optionalUser.isPresent()) {
            User foundUser = optionalUser.get();
            System.out.println("Found user ID: " + foundUser.getUserId());
            System.out.println("Found user email: " + foundUser.getEmail());
            System.out.println("Found user status: " + foundUser.getStatus());
            System.out.println("Found user role: " + foundUser.getRole());
        }

        return optionalUser.orElseThrow(() -> new RuntimeException("User not found."));
    }

    // Helper method to get user profile data
    // private Map<String, Object> getUserProfileData(User user) {
    // Map<String, Object> profileData = new HashMap<>();

    // switch (user.getRole()) {
    // case DOCTOR:
    // Optional<Doctor> doctor = doctorRepo.findById(user.getUserId());
    // if (doctor.isPresent()) {
    // Doctor d = doctor.get();
    // profileData.put("firstName", d.getFirstName());
    // profileData.put("lastName", d.getLastName());
    // profileData.put("name", d.getFirstName() + " " + d.getLastName());
    // profileData.put("specialization", d.getSpecialization());
    // profileData.put("degree", d.getDegree());
    // }
    // break;
    // case PATIENT:
    // Optional<Patient> patient = patientRepo.findById(user.getUserId());
    // if (patient.isPresent()) {
    // Patient p = patient.get();
    // profileData.put("firstName", p.getFirstName());
    // profileData.put("lastName", p.getLastName());
    // profileData.put("name", p.getFirstName() + " " + p.getLastName());
    // profileData.put("age", p.getAge());
    // profileData.put("gender", p.getGender());
    // profileData.put("bloodGroup", p.getBloodGroup());
    // }
    // break;
    // case TECHNICIAN:
    // Optional<Technician> technician = technicianRepo.findById(user.getUserId());
    // if (technician.isPresent()) {
    // Technician t = technician.get();
    // profileData.put("firstName", t.getFirstName());
    // profileData.put("lastName", t.getLastName());
    // profileData.put("name", t.getFirstName() + " " + t.getLastName());
    // profileData.put("specialization", t.getSpecialization());
    // }
    // break;
    // }

    // return profileData;
    // }

    private Map<String, Object> getUserProfileData(User user) {
        Map<String, Object> profileData = new HashMap<>();

        System.out.println("\n=== GETTING PROFILE DATA ===");
        System.out.println("User ID: " + user.getUserId());
        System.out.println("User Role: " + user.getRole());

        switch (user.getRole()) {
            case DOCTOR:
                System.out.println("Fetching doctor profile for ID: " + user.getUserId());
                try {
                    System.out.println("Doctor ID type: " + user.getUserId().getClass().getName());
                    Optional<Doctor> doctor = doctorRepo.findById(user.getUserId());
                    System.out.println("Doctor found: " + doctor.isPresent());
                    if (doctor.isPresent()) {
                        Doctor d = doctor.get();
                        profileData.put("firstName", d.getFirstName());
                        profileData.put("lastName", d.getLastName());
                        profileData.put("name", d.getFirstName() + " " + d.getLastName());
                        profileData.put("specialization", d.getSpecialization());
                        profileData.put("degree", d.getDegree());
                        System.out.println("Doctor profile loaded successfully");
                    }
                } catch (Exception e) {
                    System.err.println("Error fetching doctor profile: " + e.getMessage());
                    e.printStackTrace();
                }
                break;
            case PATIENT:
                System.out.println("Fetching patient profile for ID: " + user.getUserId());
                try {
                    System.out.println("Before findById call");
                    System.out.println("Looking up patient with ID: " + user.getUserId());
                    System.out.println("Patient ID type: " + user.getUserId().getClass().getName());

                    // Use custom query instead of findById to avoid type issues
                    Optional<Patient> patient = patientRepo.findByPatientId(user.getUserId());
                    System.out.println("After findByPatientId call");
                    System.out.println("Patient found: " + patient.isPresent());

                    if (patient.isPresent()) {
                        Patient p = patient.get();
                        System.out.println("Patient data retrieved:");
                        System.out.println("- First Name: " + p.getFirstName());
                        System.out.println("- Last Name: " + p.getLastName());
                        System.out.println("- Age: " + p.getAge());
                        System.out.println("- Gender: " + p.getGender());
                        System.out.println("- Blood Group: " + p.getBloodGroup());

                        profileData.put("firstName", p.getFirstName());
                        profileData.put("lastName", p.getLastName());
                        profileData.put("name", p.getFirstName() + " " + p.getLastName());
                        profileData.put("age", p.getAge());
                        profileData.put("gender", p.getGender() != null ? p.getGender().toString() : null);
                        profileData.put("bloodGroup", p.getBloodGroup() != null ? p.getBloodGroup().getValue() : null);
                        System.out.println("Patient profile loaded successfully");
                        System.out.println("Profile data: " + profileData);
                    } else {
                        System.out.println("No patient profile found for ID: " + user.getUserId());
                        System.out.println("This is unexpected as we saw the profile in the database!");
                    }
                } catch (Exception e) {
                    System.err.println("Error fetching patient profile: " + e.getMessage());
                    System.err.println("Stack trace:");
                    e.printStackTrace();
                }
                break;
            case TECHNICIAN:
                System.out.println("Fetching technician profile for ID: " + user.getUserId());
                try {
                    Optional<Technician> technician = technicianRepo.findById(user.getUserId());
                    System.out.println("Technician found: " + technician.isPresent());
                    if (technician.isPresent()) {
                        Technician t = technician.get();
                        profileData.put("firstName", t.getFirstName());
                        profileData.put("lastName", t.getLastName());
                        profileData.put("name", t.getFirstName() + " " + t.getLastName());
                        profileData.put("specialization", t.getSpecialization());
                        System.out.println("Technician profile loaded successfully");
                    }
                } catch (Exception e) {
                    System.err.println("Error fetching technician profile: " + e.getMessage());
                    e.printStackTrace();
                }
                break;
            case ADMIN:
                System.out.println("Admin user - no additional profile data needed");
                profileData.put("firstName", "Admin");
                profileData.put("lastName", "User");
                profileData.put("name", "Admin User");
                break;
        }

        System.out.println("Final profile data keys: " + profileData.keySet());
        System.out.println("Final profile data values: " + profileData);
        return profileData;
    }

    // CORRECTED: Login method now returns complete user data and handles status
    // properly
    @Override
    public Map<String, Object> login(LoginRequest req) {
        String identifier = req.getIdentifier().trim();
        String rawPassword = req.getPassword();

        User user;
        try {
            user = findUserByIdentifier(identifier);
            System.out.println("Found user with ID: " + user.getUserId());
            System.out.println("User role: " + user.getRole());
        } catch (RuntimeException e) {
            System.out.println("=== USER NOT FOUND ===");
            throw new RuntimeException("Invalid credentials.");
        }

        System.out.println("=== PASSWORD CHECK ===");
        System.out.println("Raw password length: " + rawPassword.length());
        System.out.println("Encoded password: " + user.getPassword());
        System.out.println("Password matches: " + encoder.matches(rawPassword, user.getPassword()));
        // Check password first
        if (!encoder.matches(rawPassword, user.getPassword())) {
            System.out.println("=== PASSWORD CHECK FAILED ===");
            throw new RuntimeException("Invalid credentials.");
        }

        // Check user status
        if (user.getStatus() == UserStatus.PENDING) {
            System.out.println("=== RETURNING PENDING RESPONSE ===");
            Map<String, Object> response = new HashMap<>();
            response.put("status", "PENDING");
            response.put("message", "Your account is pending approval.");
            System.out.println("PENDING response: " + response);
            return response;
        }

        if (user.getStatus() == UserStatus.REJECTED) {
            System.out.println("=== RETURNING REJECTED RESPONSE ===");
            Map<String, Object> response = new HashMap<>();
            response.put("status", "REJECTED");
            response.put("message", "Your account has been rejected. Please contact support.");
            System.out.println("REJECTED response: " + response);
            return response;
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("Account is not active.");
        }

        // Generate JWT token
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getUserId())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String token = jwtUtil.generateToken(userDetails);

        // Get profile data
        System.out.println("=== GETTING PROFILE DATA IN LOGIN ===");
        Map<String, Object> profileData = getUserProfileData(user);
        System.out.println("=== LOGIN RESPONSE DATA ===");
        System.out.println("Profile data: " + profileData);

        // Build complete response
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getUserId());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole().name().toLowerCase());
        response.put("status", user.getStatus().name());

        // Add profile data
        response.putAll(profileData);
        System.out.println("Final response: " + response);

        return response;
    }

    // CORRECTED: Google login method with proper status handling
    public Map<String, Object> loginWithGoogleAsPatient(String idToken) {
        FirebaseToken decoded;
        try {
            decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Invalid Google token");
        }

        String email = decoded.getEmail();
        String fullName = decoded.getName();
        String firebaseUid = decoded.getUid();

        if (email == null) {
            throw new IllegalArgumentException("Google account has no email.");
        }

        Optional<User> optUser = repo.findByEmailIgnoreCase(email.trim().toLowerCase());
        User user;

        if (optUser.isPresent()) {
            user = optUser.get();

            // Check if user is not a patient
            if (user.getRole() != UserRole.PATIENT) {
                throw new IllegalArgumentException("Google sign-in is only allowed for patients.");
            }

            // Handle non-active status
            if (user.getStatus() == UserStatus.PENDING) {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "PENDING");
                response.put("message", "Your account is pending approval.");
                return response;
            }

            if (user.getStatus() == UserStatus.REJECTED) {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "REJECTED");
                response.put("message", "Your account has been rejected. Please contact support.");
                return response;
            }

            // Ensure patient profile exists
            if (!patientRepo.existsByPatientId(user.getUserId())) {
                // Create patient profile if it doesn't exist
                PatientRegistrationDto pr = new PatientRegistrationDto();
                String[] nameParts = fullName != null ? fullName.split(" ") : new String[] { "User" };
                pr.setFirstName(nameParts[0]);
                pr.setLastName(nameParts.length > 1 ? nameParts[1] : "");
                pr.setAge(25); // Default age
                pr.setGender(Patient.Gender.Other); // Default gender for Google users - can be updated later
                pr.setBloodGroup(null);
                createPatientProfile(user.getUserId(), pr);
            }

        } else {
            // Create new patient user
            RegisterRequest fake = new RegisterRequest();
            fake.setEmail(email.trim().toLowerCase());
            fake.setPhone(null);
            fake.setPassword("GOOGLE_USER"); // Placeholder password

            String userId = createAndSaveUserOnly(fake, UserRole.PATIENT, UserStatus.ACTIVE, "P");

            // Create patient profile
            PatientRegistrationDto pr = new PatientRegistrationDto();
            String[] nameParts = fullName != null ? fullName.split(" ") : new String[] { "User" };
            pr.setFirstName(nameParts[0]);
            pr.setLastName(nameParts.length > 1 ? nameParts[1] : "");
            pr.setAge(25); // Default age for Google users
            pr.setGender(Patient.Gender.Other); // Default gender for Google users - can be updated later
            pr.setBloodGroup(null);
            createPatientProfile(userId, pr);

            user = repo.findByUserIdIgnoreCase(userId)
                    .orElseThrow(() -> new IllegalStateException("Just created patient not found."));
        }

        // Generate JWT token
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getUserId())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String token = jwtUtil.generateToken(userDetails);

        // Get profile data
        Map<String, Object> profileData = getUserProfileData(user);

        // Build response
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getUserId());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole().name().toLowerCase());
        response.put("status", user.getStatus().name());

        // Add profile data
        response.putAll(profileData);

        return response;
    }

    @Override
    public String validateTokenAndGetUsername(String token) {
        try {
            String username = jwtUtil.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (jwtUtil.validateToken(token, userDetails)) {
                return username;
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public Map<String, Object> getCurrentUserProfile(String token) {
        try {
            System.out.println("=== GET PROFILE REQUEST ===");

            // Validate token and get username (which is actually userId)
            String userId = jwtUtil.extractUsername(token);
            System.out.println("UserId extracted from token: " + userId);

            UserDetails userDetails = userDetailsService.loadUserByUsername(userId);

            if (!jwtUtil.validateToken(token, userDetails)) {
                System.out.println("Token validation failed");
                throw new RuntimeException("Invalid token");
            }

            // Find user by userId (this is what UserDetailsServiceImpl uses)
            Optional<User> userOpt = repo.findByUserIdIgnoreCase(userId);
            if (userOpt.isEmpty()) {
                System.out.println("User not found with userId: " + userId);
                throw new RuntimeException("User not found");
            }

            User user = userOpt.get();
            System.out.println("User found: " + user.getUserId() + ", Role: " + user.getRole());

            Map<String, Object> profile = new HashMap<>();

            // Add basic user info
            profile.put("userId", user.getUserId());
            profile.put("email", user.getEmail());
            profile.put("phone", user.getPhone());
            profile.put("role", user.getRole().toString());

            // Add role-specific info
            if (user.getRole() == UserRole.PATIENT) {
                System.out.println("Looking for patient record with ID: " + user.getUserId());
                Optional<Patient> patientOpt = patientRepo.findByPatientId(user.getUserId());
                if (patientOpt.isPresent()) {
                    System.out.println("Patient record found");
                    Patient patient = patientOpt.get();
                    profile.put("firstName", patient.getFirstName());
                    profile.put("lastName", patient.getLastName());
                    profile.put("age", patient.getAge());
                    profile.put("gender", patient.getGender() != null ? patient.getGender().toString() : null);
                    profile.put("bloodGroup",
                            patient.getBloodGroup() != null ? patient.getBloodGroup().getValue() : null);
                } else {
                    System.out.println("No patient record found - checking registration data");
                    // If no patient record exists, try to get data from registration data
                    try {
                        Object regData = getRegistrationData(user.getUserId(), UserRole.PATIENT);
                        if (regData instanceof PatientRegistrationDto) {
                            PatientRegistrationDto patientDto = (PatientRegistrationDto) regData;
                            profile.put("firstName", patientDto.getFirstName());
                            profile.put("lastName", patientDto.getLastName());
                            profile.put("age", patientDto.getAge());
                            profile.put("gender",
                                    patientDto.getGender() != null ? patientDto.getGender().toString() : null);
                            profile.put("bloodGroup",
                                    patientDto.getBloodGroup() != null ? patientDto.getBloodGroup().getValue() : null);
                            System.out.println("Profile data retrieved from registration data");
                        }
                    } catch (Exception e) {
                        System.out.println("Failed to get registration data: " + e.getMessage());
                        // Set default values if no data is available
                        profile.put("firstName", "");
                        profile.put("lastName", "");
                        profile.put("age", 0);
                        profile.put("gender", "");
                        profile.put("bloodGroup", null);
                    }
                }
            } else if (user.getRole() == UserRole.DOCTOR) {
                Optional<Doctor> doctorOpt = doctorRepo.findByDoctorId(user.getUserId());
                if (doctorOpt.isPresent()) {
                    Doctor doctor = doctorOpt.get();
                    profile.put("firstName", doctor.getFirstName());
                    profile.put("lastName", doctor.getLastName());
                    profile.put("specialization", doctor.getSpecialization());
                    profile.put("licenseNumber", doctor.getLicenseNumber());
                }
            } else if (user.getRole() == UserRole.TECHNICIAN) {
                Optional<Technician> technicianOpt = technicianRepo.findByTechnicianId(user.getUserId());
                if (technicianOpt.isPresent()) {
                    Technician technician = technicianOpt.get();
                    profile.put("firstName", technician.getFirstName());
                    profile.put("lastName", technician.getLastName());
                    profile.put("specialization", technician.getSpecialization());
                }
            }

            System.out.println("Profile data to return: " + profile);
            return profile;
        } catch (Exception e) {
            System.out.println("Error getting profile: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get user profile: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Map<String, Object> updateCurrentUserProfile(String token, Map<String, Object> profileUpdate) {
        try {
            // Validate token and get username (which is actually userId)
            String username = jwtUtil.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (!jwtUtil.validateToken(token, userDetails)) {
                throw new RuntimeException("Invalid token");
            }

            // Find user by userId (the JWT username is actually the userId)
            Optional<User> userOpt = repo.findByUserIdIgnoreCase(username);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("User not found");
            }

            User user = userOpt.get();
            boolean userUpdated = false;
            boolean profileUpdated = false;

            // Update user-level fields (email, phone)
            if (profileUpdate.containsKey("email")) {
                String newEmail = (String) profileUpdate.get("email");
                if (newEmail != null && !newEmail.equals(user.getEmail())) {
                    // Check if email is already taken by another user
                    Optional<User> existingUser = repo.findByEmailIgnoreCase(newEmail);
                    if (existingUser.isPresent() && !existingUser.get().getUserId().equals(user.getUserId())) {
                        throw new RuntimeException("Email already exists");
                    }
                    user.setEmail(newEmail);
                    userUpdated = true;
                }
            }

            if (profileUpdate.containsKey("phone")) {
                String newPhone = (String) profileUpdate.get("phone");
                if (newPhone != null && !newPhone.equals(user.getPhone())) {
                    // Check if phone is already taken by another user
                    Optional<User> existingUser = repo.findByPhone(newPhone);
                    if (existingUser.isPresent() && !existingUser.get().getUserId().equals(user.getUserId())) {
                        throw new RuntimeException("Phone number already exists");
                    }
                    user.setPhone(newPhone);
                    userUpdated = true;
                }
            }

            // Save user updates if any
            if (userUpdated) {
                repo.save(user);
            }

            // Update role-specific profile
            if (user.getRole() == UserRole.PATIENT) {
                Optional<Patient> patientOpt = patientRepo.findByPatientId(user.getUserId());
                if (patientOpt.isPresent()) {
                    Patient patient = patientOpt.get();

                    if (profileUpdate.containsKey("firstName")) {
                        patient.setFirstName((String) profileUpdate.get("firstName"));
                        profileUpdated = true;
                    }
                    if (profileUpdate.containsKey("lastName")) {
                        patient.setLastName((String) profileUpdate.get("lastName"));
                        profileUpdated = true;
                    }
                    if (profileUpdate.containsKey("age")) {
                        Object ageObj = profileUpdate.get("age");
                        if (ageObj instanceof Number) {
                            patient.setAge(((Number) ageObj).intValue());
                            profileUpdated = true;
                        }
                    }
                    if (profileUpdate.containsKey("gender")) {
                        String genderStr = (String) profileUpdate.get("gender");
                        if (genderStr != null && !genderStr.isEmpty()) {
                            try {
                                patient.setGender(Patient.Gender.valueOf(genderStr.toUpperCase()));
                                profileUpdated = true;
                            } catch (IllegalArgumentException e) {
                                // Invalid gender value, skip this update
                                System.out.println("Invalid gender value: " + genderStr);
                            }
                        } else {
                            // Allow setting gender to null
                            patient.setGender(null);
                            profileUpdated = true;
                        }
                    }
                    if (profileUpdate.containsKey("bloodGroup")) {
                        String bloodGroupStr = (String) profileUpdate.get("bloodGroup");
                        if (bloodGroupStr != null && !bloodGroupStr.isEmpty()) {
                            boolean found = false;
                            for (Patient.BloodGroup bg : Patient.BloodGroup.values()) {
                                if (bg.getValue().equals(bloodGroupStr)) {
                                    patient.setBloodGroup(bg);
                                    profileUpdated = true;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                System.out.println("Invalid blood group value: " + bloodGroupStr);
                            }
                        } else {
                            // Allow setting blood group to null
                            patient.setBloodGroup(null);
                            profileUpdated = true;
                        }
                    }

                    if (profileUpdated) {
                        patientRepo.save(patient);
                    }
                }
            }

            // Return the updated profile
            return getCurrentUserProfile(token);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update user profile: " + e.getMessage());
        }
    }
}