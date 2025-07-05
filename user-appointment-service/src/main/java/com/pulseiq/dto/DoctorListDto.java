package com.pulseiq.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class DoctorListDto {
    
    private String doctorId;
    private String firstName;
    private String lastName;
    private String specialization;
    private String degree;
    private Boolean isAvailable;
    private String profilePicture; // Base64 encoded image
    private java.math.BigDecimal consultationFee;
    
    public String getFullName() {
        return firstName + " " + lastName;
    }
}
