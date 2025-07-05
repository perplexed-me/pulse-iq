package com.pulseiq.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String phone;
    private String password;
    private String role;
    private String firstName;
    private String lastName;
}

