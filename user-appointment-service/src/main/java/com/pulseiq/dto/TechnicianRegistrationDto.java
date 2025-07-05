package com.pulseiq.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class TechnicianRegistrationDto extends RegisterRequest {

    @NotBlank(message = "Specialization is required")
    @Size(max = 100, message = "Specialization must be under 100 characters")
    private String specialization;
}
