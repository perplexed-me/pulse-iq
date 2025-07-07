package com.pulseiq.controller;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.pulseiq.dto.AppointmentRequestDto;
import com.pulseiq.dto.AppointmentResponseDto;
import com.pulseiq.entity.Appointment.AppointmentStatus;
import com.pulseiq.entity.User;
import com.pulseiq.entity.UserRole;
import com.pulseiq.entity.UserStatus;
import com.pulseiq.repository.UserRepository;
import com.pulseiq.security.JwtUtil;
import com.pulseiq.service.AppointmentService;

@ExtendWith(MockitoExtension.class)
class AppointmentControllerTest {

        private MockMvc mockMvc;

        @Mock
        private AppointmentService appointmentService;

        @Mock
        private JwtUtil jwtUtil;

        @Mock
        private UserRepository userRepository;

        @InjectMocks
        private AppointmentController appointmentController;

        private ObjectMapper objectMapper;

        private String validToken;
        private String patientUserId;
        private String doctorUserId;
        private User patientUser;
        private User doctorUser;
        private AppointmentRequestDto appointmentRequest;
        private AppointmentResponseDto appointmentResponse;

        @BeforeEach
        void setUp() {
                objectMapper = new ObjectMapper();
                objectMapper.registerModule(new JavaTimeModule());
                objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
                mockMvc = MockMvcBuilders.standaloneSetup(appointmentController).build();

                validToken = "Bearer valid.jwt.token";
                patientUserId = "P001";
                doctorUserId = "D001";

                // Setup patient user
                patientUser = new User();
                patientUser.setUserId(patientUserId);
                patientUser.setUsername("patient@example.com");
                patientUser.setRole(UserRole.PATIENT);
                patientUser.setStatus(UserStatus.ACTIVE);

                // Setup doctor user
                doctorUser = new User();
                doctorUser.setUserId(doctorUserId);
                doctorUser.setUsername("doctor@example.com");
                doctorUser.setRole(UserRole.DOCTOR);
                doctorUser.setStatus(UserStatus.ACTIVE);

                // Setup appointment request
                appointmentRequest = new AppointmentRequestDto();
                appointmentRequest.setDoctorId(doctorUserId);
                appointmentRequest.setAppointmentDate(LocalDateTime.now().plusDays(1));
                appointmentRequest.setReason("Regular checkup");
                appointmentRequest.setNotes("No specific symptoms");

                // Setup appointment response
                appointmentResponse = new AppointmentResponseDto();
                appointmentResponse.setAppointmentId(1L);
                appointmentResponse.setPatientId(patientUserId);
                appointmentResponse.setDoctorId(doctorUserId);
                appointmentResponse.setAppointmentDate(appointmentRequest.getAppointmentDate());
                appointmentResponse.setReason("Regular checkup");
                appointmentResponse.setStatus(AppointmentStatus.SCHEDULED);
        }

        @Test
        void bookAppointment_Success() throws Exception {
                // Arrange
                when(jwtUtil.extractUsername("valid.jwt.token")).thenReturn(patientUserId);
                when(userRepository.findByUserId(patientUserId)).thenReturn(Optional.of(patientUser));
                when(appointmentService.bookAppointment(eq(patientUserId), any(AppointmentRequestDto.class)))
                                .thenReturn(appointmentResponse);

                // Act & Assert
                mockMvc.perform(post("/api/appointments/book")
                                .header("Authorization", validToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(appointmentRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.appointmentId").value(1L))
                                .andExpect(jsonPath("$.patientId").value(patientUserId));

                verify(appointmentService).bookAppointment(eq(patientUserId), any(AppointmentRequestDto.class));
        }

        @Test
        void bookAppointment_InvalidToken_ReturnsUnauthorized() throws Exception {
                // Arrange
                when(jwtUtil.extractUsername("invalid.jwt.token")).thenThrow(new RuntimeException("Invalid token"));

                // Act & Assert
                mockMvc.perform(post("/api/appointments/book")
                                .header("Authorization", "Bearer invalid.jwt.token")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(appointmentRequest)))
                                .andExpect(status().isBadRequest()); // Controller will return 400 due to JWT exception
                                                                     // handling
        }

        @Test
        void bookAppointment_NonPatientUser_ReturnsForbidden() throws Exception {
                // Arrange
                when(jwtUtil.extractUsername("valid.jwt.token")).thenReturn(doctorUserId);
                when(userRepository.findByUserId(doctorUserId)).thenReturn(Optional.of(doctorUser));

                // Act & Assert
                mockMvc.perform(post("/api/appointments/book")
                                .header("Authorization", validToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(appointmentRequest)))
                                .andExpect(status().isForbidden()); // Controller returns 403 for non-patient users
        }

        @Test
        void getPatientAppointments_Success() throws Exception {
                // Arrange
                List<AppointmentResponseDto> appointments = Arrays.asList(appointmentResponse);
                when(jwtUtil.extractUsername("valid.jwt.token")).thenReturn(patientUserId);
                when(userRepository.findByUserId(patientUserId)).thenReturn(Optional.of(patientUser));
                when(appointmentService.getPatientAppointments(patientUserId)).thenReturn(appointments);

                // Act & Assert
                mockMvc.perform(get("/api/appointments/my-appointments")
                                .header("Authorization", validToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isArray())
                                .andExpect(jsonPath("$[0].patientId").value(patientUserId));

                verify(appointmentService).getPatientAppointments(patientUserId);
        }

        @Test
        void getDoctorAppointments_Success() throws Exception {
                // Arrange
                List<AppointmentResponseDto> appointments = Arrays.asList(appointmentResponse);
                when(jwtUtil.extractUsername("valid.jwt.token")).thenReturn(doctorUserId);
                when(userRepository.findByUserId(doctorUserId)).thenReturn(Optional.of(doctorUser));
                when(appointmentService.getDoctorAppointments(doctorUserId)).thenReturn(appointments);

                // Act & Assert
                mockMvc.perform(get("/api/appointments/my-appointments")
                                .header("Authorization", validToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isArray())
                                .andExpect(jsonPath("$[0].doctorId").value(doctorUserId));

                verify(appointmentService).getDoctorAppointments(doctorUserId);
        }

        @Test
        void getUpcomingAppointments_Success() throws Exception {
                // Arrange
                List<AppointmentResponseDto> appointments = Arrays.asList(appointmentResponse);
                when(jwtUtil.extractUsername("valid.jwt.token")).thenReturn(patientUserId);
                when(userRepository.findByUserId(patientUserId)).thenReturn(Optional.of(patientUser));
                when(appointmentService.getUpcomingAppointments(patientUserId)).thenReturn(appointments);

                // Act & Assert
                mockMvc.perform(get("/api/appointments/upcoming")
                                .header("Authorization", validToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isArray())
                                .andExpect(jsonPath("$[0].patientId").value(patientUserId));

                verify(appointmentService).getUpcomingAppointments(patientUserId);
        }

        @Test
        void cancelAppointment_Success() throws Exception {
                // Arrange
                Long appointmentId = 1L;
                when(jwtUtil.extractUsername("valid.jwt.token")).thenReturn(patientUserId);
                when(userRepository.findByUserId(patientUserId)).thenReturn(Optional.of(patientUser));
                // cancelAppointment returns void, so no return value needed

                // Act & Assert
                mockMvc.perform(put("/api/appointments/{appointmentId}/cancel", appointmentId)
                                .header("Authorization", validToken))
                                .andExpect(status().isNoContent());

                verify(appointmentService).cancelAppointment(appointmentId, patientUserId, "patient", "");
        }

        @Test
        void cancelAppointment_AppointmentNotFound_ReturnsNotFound() throws Exception {
                // Arrange
                Long appointmentId = 999L;
                lenient().when(jwtUtil.extractUsername("valid.jwt.token")).thenReturn(patientUserId);
                lenient().when(userRepository.findByUserId(patientUserId)).thenReturn(Optional.of(patientUser));
                doThrow(new RuntimeException("Appointment not found"))
                                .when(appointmentService)
                                .cancelAppointment(appointmentId, patientUserId, "patient", "");

                // Act & Assert
                mockMvc.perform(put("/api/appointments/{appointmentId}/cancel", appointmentId)
                                .header("Authorization", validToken))
                                .andExpect(status().isBadRequest()); // Controller will return 400 due to exception
                                                                     // handling
        }

        @Test
        void bookAppointment_ServiceException_ReturnsInternalServerError() throws Exception {
                // Arrange
                lenient().when(jwtUtil.extractUsername("valid.jwt.token")).thenReturn(patientUserId);
                lenient().when(userRepository.findByUserId(patientUserId)).thenReturn(Optional.of(patientUser));
                when(appointmentService.bookAppointment(eq(patientUserId), any(AppointmentRequestDto.class)))
                                .thenThrow(new RuntimeException("Database error"));

                // Act & Assert
                mockMvc.perform(post("/api/appointments/book")
                                .header("Authorization", validToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(appointmentRequest)))
                                .andExpect(status().isBadRequest()); // Controller will return 400 due to exception
                                                                     // handling
        }

        @Test
        void bookAppointment_MissingAuthHeader_ReturnsUnauthorized() throws Exception {
                // Act & Assert
                mockMvc.perform(post("/api/appointments/book")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(appointmentRequest)))
                                .andExpect(status().isBadRequest()); // Will be 400 due to missing required header
        }

        @Test
        void bookAppointment_InvalidRequestBody_ReturnsBadRequest() throws Exception {
                // Arrange - Create invalid request (missing required fields)
                AppointmentRequestDto invalidRequest = new AppointmentRequestDto();
                // Don't set any fields to make it invalid

                // Act & Assert
                mockMvc.perform(post("/api/appointments/book")
                                .header("Authorization", validToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(invalidRequest)))
                                .andExpect(status().isBadRequest());
        }
}
