package com.pulseiq.controller;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pulseiq.dto.LoginRequest;
import com.pulseiq.dto.PatientRegistrationDto;
import com.pulseiq.entity.Patient;
import com.pulseiq.service.UserService;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthController authController;

    private ObjectMapper objectMapper;

    private LoginRequest loginRequest;
    private PatientRegistrationDto patientRegistrationDto;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();

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
        patientRegistrationDto.setGender(Patient.Gender.Male); // Add required gender field
    }

    @Test
    void login_Success_ReturnsOk() throws Exception {
        // Arrange
        Map<String, Object> loginResponse = new HashMap<>();
        loginResponse.put("message", "Login successful");
        loginResponse.put("token", "mock.jwt.token");
        loginResponse.put("userId", "P202501001");
        loginResponse.put("userRole", "PATIENT");

        when(userService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.userId").value("P202501001"))
                .andExpect(jsonPath("$.userRole").value("PATIENT"));

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    void login_PendingStatus_ReturnsAccepted() throws Exception {
        // Arrange
        Map<String, Object> loginResponse = new HashMap<>();
        loginResponse.put("message", "Account is pending approval");
        loginResponse.put("status", "PENDING");

        when(userService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value("Account is pending approval"))
                .andExpect(jsonPath("$.status").value("PENDING"));

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    void login_RejectedStatus_ReturnsForbidden() throws Exception {
        // Arrange
        Map<String, Object> loginResponse = new HashMap<>();
        loginResponse.put("message", "Account has been rejected");
        loginResponse.put("status", "REJECTED");

        when(userService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Account has been rejected"))
                .andExpect(jsonPath("$.status").value("REJECTED"));

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    void login_InvalidCredentials_ReturnsUnauthorized() throws Exception {
        // Arrange
        when(userService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Invalid credentials"));

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid credentials"));

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    void login_MissingRequestBody_ReturnsBadRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());

        verify(userService, never()).login(any());
    }

    @Test
    void registerPatient_Success_ReturnsOk() throws Exception {
        // Arrange
        doNothing().when(userService).registerPatient(any(PatientRegistrationDto.class));

        // Act & Assert
        mockMvc.perform(post("/api/auth/register/patient")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(patientRegistrationDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Patient registered successfully. You can now login."))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        verify(userService).registerPatient(any(PatientRegistrationDto.class));
    }

    @Test
    void registerPatient_EmailAlreadyExists_ReturnsBadRequest() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Email already exists"))
                .when(userService).registerPatient(any(PatientRegistrationDto.class));

        // Act & Assert
        mockMvc.perform(post("/api/auth/register/patient")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(patientRegistrationDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already exists"));

        verify(userService).registerPatient(any(PatientRegistrationDto.class));
    }

    @Test
    void registerPatient_InvalidData_ReturnsBadRequest() throws Exception {
        // Arrange - Invalid patient data (missing required fields)
        PatientRegistrationDto invalidDto = new PatientRegistrationDto();
        invalidDto.setEmail("invalid-email");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register/patient")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest());

        verify(userService, never()).registerPatient(any());
    }

    @Test
    void loginWithInvalidJson_ReturnsBadRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("invalid json"))
                .andExpect(status().isBadRequest());

        verify(userService, never()).login(any());
    }

    @Test
    void login_ServiceException_ReturnsUnauthorized() throws Exception {
        // Arrange
        when(userService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Database connection failed"));

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Database connection failed"));

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    void login_NullPointerException_ReturnsUnauthorized() throws Exception {
        // Arrange
        when(userService.login(any(LoginRequest.class)))
                .thenThrow(new NullPointerException("Null reference"));

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Null reference"));

        verify(userService).login(any(LoginRequest.class));
    }

    @Test
    void registerPatient_WithValidationErrors_ReturnsBadRequest() throws Exception {
        // Arrange - Patient with validation errors (null age, invalid email)
        PatientRegistrationDto invalidPatient = new PatientRegistrationDto();
        invalidPatient.setEmail("invalid.email.format");
        invalidPatient.setPassword("short");
        invalidPatient.setFirstName("");
        invalidPatient.setLastName("");
        // Missing age and gender

        // Act & Assert
        mockMvc.perform(post("/api/auth/register/patient")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidPatient)))
                .andExpect(status().isBadRequest());

        // Verify service is never called due to validation failure
        verify(userService, never()).registerPatient(any());
    }
}
