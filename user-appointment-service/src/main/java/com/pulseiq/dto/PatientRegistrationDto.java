package com.pulseiq.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import com.pulseiq.entity.Patient;



@Data
public class PatientRegistrationDto extends RegisterRequest {

    @NotNull(message = "Age is required")
    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 109, message = "Age must be realistic")
    private Integer age;

    @NotNull(message = "Gender is required")
    private Patient.Gender gender;

    private Patient.BloodGroup bloodGroup;
}