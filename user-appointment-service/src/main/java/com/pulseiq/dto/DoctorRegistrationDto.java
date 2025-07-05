package com.pulseiq.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
@Data
public class DoctorRegistrationDto extends RegisterRequest {
    @NotBlank private String specialization;
    @NotBlank private String degree;
    @NotBlank private String licenseNumber;
    private String assistantName;
    private String assistantNumber;
    private String consultationFee;
}