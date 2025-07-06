package com.pulseiq.service;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.pulseiq.dto.LoginRequest;
import com.pulseiq.dto.PatientRegistrationDto;
import com.pulseiq.entity.Patient;
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

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository repo;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepo;

    @Mock
    private TechnicianRepository technicianRepository;

    @Mock
    private RegistrationDataRepository registrationDataRepo;

    @Mock
    private PasswordEncoder encoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    @Mock
    private FirebaseAuth firebaseAuth;

    @InjectMocks
    private UserServiceImpl userService;

    private User mockUser;
    private UserDetails mockUserDetails;
    private LoginRequest loginRequest;
    private PatientRegistrationDto patientRegistrationDto;

    @BeforeEach
    void setUp() {
        // Setup mock user
        mockUser = new User();
        mockUser.setUserId("P202501001");
        mockUser.setUsername("patient@example.com");
        mockUser.setPassword("encoded_password");
        mockUser.setEmail("patient@example.com");
        mockUser.setPhone("+8801234567890");
        mockUser.setRole(UserRole.PATIENT);
        mockUser.setStatus(UserStatus.ACTIVE);

        // Setup mock UserDetails
        mockUserDetails = org.springframework.security.core.userdetails.User.builder()
                .username("patient@example.com")
                .password("encoded_password")
                .authorities(Arrays.asList(new SimpleGrantedAuthority("ROLE_PATIENT")))
                .build();

        // Setup login request
        loginRequest = new LoginRequest();
        loginRequest.setIdentifier("patient@example.com");
        loginRequest.setPassword("password123");

        // Setup patient registration DTO
        patientRegistrationDto = new PatientRegistrationDto();
        patientRegistrationDto.setEmail("newpatient@example.com");
        patientRegistrationDto.setPassword("password123");
        patientRegistrationDto.setFirstName("John");
        patientRegistrationDto.setLastName("Doe");
        patientRegistrationDto.setPhone("+8801234567890");
        patientRegistrationDto.setAge(30);
        patientRegistrationDto.setGender(Patient.Gender.Male);
        patientRegistrationDto.setBloodGroup(Patient.BloodGroup.A_POSITIVE);
    }

    @Test
    void login_Success() {
        // Arrange
        Patient mockPatient = new Patient();
        mockPatient.setPatientId("P202501001");
        mockPatient.setFirstName("Jane");
        mockPatient.setLastName("Doe");

        when(encoder.matches("password123", "encoded_password")).thenReturn(true);
        when(repo.findByEmailIgnoreCase("patient@example.com")).thenReturn(Optional.of(mockUser));
        when(patientRepo.findByPatientId("P202501001")).thenReturn(Optional.of(mockPatient));
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("mock.jwt.token");

        // Act
        Map<String, Object> result = userService.login(loginRequest);

        // Assert
        assertNotNull(result);
        assertEquals("mock.jwt.token", result.get("token"));
        assertEquals("P202501001", result.get("userId"));
        assertEquals("patient", result.get("role"));
        assertEquals("patient@example.com", result.get("email"));
        assertEquals("+8801234567890", result.get("phone"));
        assertEquals("Jane", result.get("firstName"));
        assertEquals("Doe", result.get("lastName"));
        assertEquals("Jane Doe", result.get("name"));

        verify(encoder, atLeastOnce()).matches("password123", "encoded_password");
        verify(jwtUtil).generateToken(any(UserDetails.class));
    }

    @Test
    void login_InvalidCredentials_ThrowsException() {
        // Arrange
        // Mock the user lookup to return a user (so we proceed to password check)
        when(repo.findByEmailIgnoreCase("patient@example.com")).thenReturn(Optional.of(mockUser));
        when(encoder.matches("wrong_password", "encoded_password")).thenReturn(false);

        loginRequest.setPassword("wrong_password");

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.login(loginRequest));
        assertEquals("Invalid credentials.", exception.getMessage());

        verify(encoder, atLeastOnce()).matches("wrong_password", "encoded_password");
        verify(jwtUtil, never()).generateToken(any());
    }

    @Test
    void login_UserNotFound_ThrowsException() {
        // Arrange
        when(repo.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());

        loginRequest.setIdentifier("nonexistent@example.com");

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.login(loginRequest));
        assertEquals("Invalid credentials.", exception.getMessage());

        verify(repo).findByEmailIgnoreCase("nonexistent@example.com");
        verify(encoder, never()).matches(anyString(), anyString());
    }

    @Test
    void loginWithGoogleAsPatient_Success() throws FirebaseAuthException {
        // Arrange
        String idToken = "valid.firebase.token";
        FirebaseToken mockFirebaseToken = mock(FirebaseToken.class);

        Patient mockPatient = new Patient();
        mockPatient.setPatientId("P202501001");
        mockPatient.setFirstName("Firebase");
        mockPatient.setLastName("User");

        User savedUser = new User();
        savedUser.setUserId("P202501001");
        savedUser.setEmail("firebase@example.com");
        savedUser.setUsername("firebase@example.com");
        savedUser.setPassword("encoded_firebase_password");
        savedUser.setRole(UserRole.PATIENT);
        savedUser.setStatus(UserStatus.ACTIVE);

        when(mockFirebaseToken.getEmail()).thenReturn("firebase@example.com");
        when(mockFirebaseToken.getName()).thenReturn("Firebase User");

        // Mock the repository calls for user creation and lookup
        when(repo.findByEmailIgnoreCase("firebase@example.com")).thenReturn(Optional.empty());
        when(repo.findTopByUserIdStartingWithOrderByUserIdDesc(anyString())).thenReturn(Optional.empty());
        when(repo.save(any(User.class))).thenReturn(savedUser);
        when(repo.findByUserIdIgnoreCase(anyString())).thenReturn(Optional.of(savedUser));
        when(patientRepo.save(any(Patient.class))).thenReturn(mockPatient);
        when(patientRepo.findByPatientId(anyString())).thenReturn(Optional.of(mockPatient));
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("mock.jwt.token");

        try (MockedStatic<FirebaseAuth> firebaseAuthMock = mockStatic(FirebaseAuth.class)) {
            FirebaseAuth mockAuth = mock(FirebaseAuth.class);
            firebaseAuthMock.when(FirebaseAuth::getInstance).thenReturn(mockAuth);
            when(mockAuth.verifyIdToken(idToken)).thenReturn(mockFirebaseToken);

            // Act
            Map<String, Object> result = userService.loginWithGoogleAsPatient(idToken);

            // Assert
            assertNotNull(result);
            assertEquals("mock.jwt.token", result.get("token"));
            assertTrue(result.get("userId").toString().startsWith("P"));
            assertEquals("patient", result.get("role"));
            assertEquals("firebase@example.com", result.get("email"));
        }
    }

    @Test
    void loginWithGoogleAsPatient_InvalidToken_ThrowsException() throws FirebaseAuthException {
        // Arrange
        String invalidToken = "invalid.firebase.token";

        try (MockedStatic<FirebaseAuth> firebaseAuthMock = mockStatic(FirebaseAuth.class)) {
            FirebaseAuth mockAuth = mock(FirebaseAuth.class);
            firebaseAuthMock.when(FirebaseAuth::getInstance).thenReturn(mockAuth);
            when(mockAuth.verifyIdToken(invalidToken)).thenThrow(new RuntimeException("Invalid Firebase token"));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> userService.loginWithGoogleAsPatient(invalidToken));
            assertNotNull(exception);
        }
    }

    @Test
    void registerPatient_Success() {
        // Arrange
        when(repo.findByEmailIgnoreCase("newpatient@example.com")).thenReturn(Optional.empty());
        when(repo.findByPhone("+8801234567890")).thenReturn(Optional.empty());
        when(encoder.encode("password123")).thenReturn("encoded_password");
        when(repo.findTopByUserIdStartingWithOrderByUserIdDesc(anyString())).thenReturn(Optional.empty());

        User savedUser = new User();
        savedUser.setUserId("P202501001");
        savedUser.setUsername("newpatient@example.com");
        savedUser.setRole(UserRole.PATIENT);
        savedUser.setStatus(UserStatus.PENDING);

        when(repo.save(any(User.class))).thenReturn(savedUser);

        // Act
        assertDoesNotThrow(() -> userService.registerPatient(patientRegistrationDto));

        // Assert
        verify(repo).findByEmailIgnoreCase("newpatient@example.com");
        verify(repo).findByPhone("+8801234567890");
        verify(encoder).encode("password123");
        verify(repo).save(any(User.class));
    }

    @Test
    void registerPatient_EmailAlreadyExists_ThrowsException() {
        // Arrange
        when(repo.findByEmailIgnoreCase("newpatient@example.com")).thenReturn(Optional.of(mockUser));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> userService.registerPatient(patientRegistrationDto));
        assertTrue(exception.getMessage().contains("already exists")
                || exception.getMessage().contains("already registered"));

        verify(repo).findByEmailIgnoreCase("newpatient@example.com");
        verify(repo, never()).save(any());
    }

    @Test
    void registerPatient_PhoneAlreadyExists_ThrowsException() {
        // Arrange
        when(repo.findByEmailIgnoreCase("newpatient@example.com")).thenReturn(Optional.empty());
        when(repo.findByPhone("+8801234567890")).thenReturn(Optional.of(mockUser));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> userService.registerPatient(patientRegistrationDto));
        assertTrue(exception.getMessage().contains("already exists")
                || exception.getMessage().contains("already registered"));

        verify(repo).findByPhone("+8801234567890");
        verify(repo, never()).save(any());
    }

    @Test
    void approveUser_Success() {
        // Arrange
        User pendingUser = new User();
        pendingUser.setUserId("P202501001");
        pendingUser.setStatus(UserStatus.PENDING);
        pendingUser.setRole(UserRole.PATIENT);

        when(repo.findByUserIdIgnoreCase("P202501001")).thenReturn(Optional.of(pendingUser));
        when(repo.save(any(User.class))).thenReturn(pendingUser);
        when(registrationDataRepo.findByUserId("P202501001")).thenReturn(Optional.empty());

        // Act
        userService.approveUser("P202501001");

        // Assert
        verify(repo).findByUserIdIgnoreCase("P202501001");
        verify(repo).save(argThat(user -> user.getStatus() == UserStatus.ACTIVE));
    }

    @Test
    void approveUser_UserNotFound_ThrowsException() {
        // Arrange
        when(repo.findByUserIdIgnoreCase("NONEXISTENT")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.approveUser("NONEXISTENT"));
        assertTrue(exception.getMessage().contains("User not found")
                || exception.getMessage().contains("Failed to approve user"));

        verify(repo).findByUserIdIgnoreCase("NONEXISTENT");
        verify(repo, never()).save(any());
    }

    @Test
    void rejectUser_Success() {
        // Arrange
        User pendingUser = new User();
        pendingUser.setUserId("P202501001");
        pendingUser.setStatus(UserStatus.PENDING);

        when(repo.findByUserIdIgnoreCase("P202501001")).thenReturn(Optional.of(pendingUser));
        when(repo.save(any(User.class))).thenReturn(pendingUser);

        // Act
        userService.rejectUser("P202501001");

        // Assert
        verify(repo).findByUserIdIgnoreCase("P202501001");
        verify(repo).save(argThat(user -> ((User) user).getStatus() == UserStatus.REJECTED));
    }

    @Test
    void validateTokenAndGetUsername_ValidToken_ReturnsUsername() {
        // Arrange
        String token = "valid.jwt.token";
        when(jwtUtil.extractUsername(token)).thenReturn("patient@example.com");
        when(userDetailsService.loadUserByUsername("patient@example.com")).thenReturn(mockUserDetails);
        when(jwtUtil.validateToken(token, mockUserDetails)).thenReturn(true);

        // Act
        String username = userService.validateTokenAndGetUsername(token);

        // Assert
        assertEquals("patient@example.com", username);
        verify(jwtUtil).extractUsername(token);
        verify(jwtUtil).validateToken(token, mockUserDetails);
    }

    @Test
    void validateTokenAndGetUsername_InvalidToken_ReturnsNull() {
        // Arrange
        String token = "invalid.jwt.token";
        when(jwtUtil.extractUsername(token)).thenReturn("patient@example.com");
        when(userDetailsService.loadUserByUsername("patient@example.com")).thenReturn(mockUserDetails);
        when(jwtUtil.validateToken(token, mockUserDetails)).thenReturn(false);

        // Act
        String username = userService.validateTokenAndGetUsername(token);

        // Assert
        assertNull(username);
        verify(jwtUtil).validateToken(token, mockUserDetails);
    }

    @Test
    void getCurrentUserProfile_PatientUser_ReturnsProfileWithPatientData() {
        // Arrange
        String token = "valid.jwt.token";
        Patient mockPatient = new Patient();
        mockPatient.setPatientId("P202501001");
        mockPatient.setFirstName("John");
        mockPatient.setLastName("Doe");

        when(jwtUtil.extractUsername(token)).thenReturn("patient@example.com");
        when(userDetailsService.loadUserByUsername("patient@example.com")).thenReturn(mockUserDetails);
        when(jwtUtil.validateToken(token, mockUserDetails)).thenReturn(true);
        when(repo.findByUserIdIgnoreCase("patient@example.com")).thenReturn(Optional.of(mockUser));
        when(patientRepo.findByPatientId("P202501001")).thenReturn(Optional.of(mockPatient));

        // Act
        Map<String, Object> profile = userService.getCurrentUserProfile(token);

        // Assert
        assertNotNull(profile);
        assertEquals("P202501001", profile.get("userId"));
        assertEquals("PATIENT", profile.get("role"));
        assertEquals("John", profile.get("firstName"));
        assertEquals("Doe", profile.get("lastName"));
    }
}
