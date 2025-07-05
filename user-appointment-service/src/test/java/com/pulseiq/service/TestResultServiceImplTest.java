package com.pulseiq.service;

import com.pulseiq.dto.TestResultUploadDto;
import com.pulseiq.dto.TestResultResponseDto;
import com.pulseiq.entity.TestResult;
import com.pulseiq.repository.TestResultRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TestResultServiceImplTest {

    @Mock
    private TestResultRepository testResultRepository;
    
    @Mock
    private TestResultValidationService validationService;
    
    @Mock
    private MultipartFile mockPdfFile;
    
    @InjectMocks
    private TestResultServiceImpl testResultService;

    @Test
    void uploadTestResult_Success() throws IOException {
        // Arrange
        String technicianId = "T123";
        TestResultUploadDto uploadDto = new TestResultUploadDto();
        uploadDto.setTestName("Blood Test");
        uploadDto.setTestType("Blood");
        uploadDto.setDescription("Routine blood work");
        uploadDto.setPatientId("P456");
        uploadDto.setDoctorId("D789");
        uploadDto.setPdfFile(mockPdfFile);
        uploadDto.setTestDate(LocalDateTime.now());
        uploadDto.setNotes("Fasting required");

        // Mock validation service
        TestResultValidationService.ValidationResult validResult = 
            TestResultValidationService.ValidationResult.valid();
        when(validationService.validateTestResultUpload(
            anyString(), anyString(), anyString(), anyString(), anyString(), any(MultipartFile.class)))
            .thenReturn(validResult);

        // Mock file operations
        when(mockPdfFile.getOriginalFilename()).thenReturn("test_result.pdf");
        when(mockPdfFile.getSize()).thenReturn(1024L);
        when(mockPdfFile.getBytes()).thenReturn(new byte[]{1, 2, 3, 4});

        // Mock repository operations
        TestResult savedTestResult = new TestResult();
        savedTestResult.setTestId(1L);
        savedTestResult.setTestName("Blood Test");
        savedTestResult.setTestType("Blood");
        savedTestResult.setPatientId("P456");
        savedTestResult.setDoctorId("D789");
        savedTestResult.setTechnicianId(technicianId);
        savedTestResult.setStatus(TestResult.TestStatus.COMPLETED);
        
        when(testResultRepository.save(any(TestResult.class))).thenReturn(savedTestResult);
        when(testResultRepository.findById(1L)).thenReturn(Optional.of(savedTestResult));

        // Act
        TestResultResponseDto result = testResultService.uploadTestResult(uploadDto, technicianId);

        // Assert
        assertNotNull(result);
        assertEquals("Blood Test", result.getTestName());
        assertEquals("Blood", result.getTestType());
        assertEquals("P456", result.getPatientId());
        assertEquals("D789", result.getDoctorId());
        assertEquals(technicianId, result.getTechnicianId());
        assertEquals(TestResult.TestStatus.COMPLETED, result.getStatus());

        // Verify interactions
        verify(validationService).validateTestResultUpload(
            "Blood Test", "Blood", "P456", "D789", technicianId, mockPdfFile);
        verify(testResultRepository).save(any(TestResult.class));
        verify(testResultRepository).findById(1L);
    }

    @Test
    void uploadTestResult_ValidationFailure() {
        // Arrange
        String technicianId = "T123";
        TestResultUploadDto uploadDto = new TestResultUploadDto();
        uploadDto.setTestName("");
        uploadDto.setTestType("Blood");
        uploadDto.setPatientId("P456");
        uploadDto.setDoctorId("D789");
        uploadDto.setPdfFile(mockPdfFile);

        // Mock validation service to return error
        TestResultValidationService.ValidationResult invalidResult = 
            TestResultValidationService.ValidationResult.invalid("Test name is required");
        when(validationService.validateTestResultUpload(
            anyString(), anyString(), anyString(), anyString(), anyString(), any(MultipartFile.class)))
            .thenReturn(invalidResult);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            testResultService.uploadTestResult(uploadDto, technicianId);
        });

        assertEquals("Test name is required", exception.getMessage());
        
        // Verify that repository save was never called
        verify(testResultRepository, never()).save(any(TestResult.class));
    }

    @Test
    void getTestResultById_Success() {
        // Arrange
        Long testId = 1L;
        TestResult testResult = new TestResult();
        testResult.setTestId(testId);
        testResult.setTestName("Blood Test");
        testResult.setTestType("Blood");
        testResult.setPatientId("P456");
        testResult.setDoctorId("D789");
        testResult.setTechnicianId("T123");
        testResult.setStatus(TestResult.TestStatus.COMPLETED);

        when(testResultRepository.findById(testId)).thenReturn(Optional.of(testResult));

        // Act
        TestResultResponseDto result = testResultService.getTestResultById(testId);

        // Assert
        assertNotNull(result);
        assertEquals(testId, result.getTestId());
        assertEquals("Blood Test", result.getTestName());
        assertEquals("Blood", result.getTestType());
        assertEquals("P456", result.getPatientId());
        assertEquals("D789", result.getDoctorId());
        assertEquals("T123", result.getTechnicianId());
        assertEquals(TestResult.TestStatus.COMPLETED, result.getStatus());

        verify(testResultRepository).findById(testId);
    }

    @Test
    void getTestResultById_NotFound() {
        // Arrange
        Long testId = 999L;
        when(testResultRepository.findById(testId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            testResultService.getTestResultById(testId);
        });

        assertEquals("Test result not found with ID: " + testId, exception.getMessage());
        verify(testResultRepository).findById(testId);
    }
}
