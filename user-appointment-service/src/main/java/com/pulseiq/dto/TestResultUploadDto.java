package com.pulseiq.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;

@Data
public class TestResultUploadDto {

    @NotBlank(message = "Test name is required")
    @Size(max = 100, message = "Test name must not exceed 100 characters")
    private String testName;

    @NotBlank(message = "Test type is required")
    @Size(max = 50, message = "Test type must not exceed 50 characters")
    private String testType;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @NotBlank(message = "Doctor ID is required")
    private String doctorId;

    @NotNull(message = "PDF file is required")
    private MultipartFile pdfFile;

    private LocalDateTime testDate;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
