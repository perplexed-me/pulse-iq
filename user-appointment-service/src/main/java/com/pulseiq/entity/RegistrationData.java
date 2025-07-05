// package com.pulseiq.entity;

// import jakarta.persistence.*;
// import org.hibernate.annotations.CreationTimestamp;

// import java.time.LocalDateTime;

// @Entity
// @Table(name = "registration_data", schema = "pulseiq")
// public class RegistrationData {
//     @Id
//     private String userId;

//     @Lob
//     @Column(columnDefinition = "TEXT")
//     private String registrationJson;

//     @Enumerated(EnumType.STRING)
//     private UserRole role;

//     @CreationTimestamp
//     private LocalDateTime createdAt;

//     // Constructors
//     public RegistrationData() {}

//     public RegistrationData(String userId, String registrationJson, UserRole role) {
//         this.userId = userId;
//         this.registrationJson = registrationJson;
//         this.role = role;
//     }

//     // Getters and setters
//     public String getUserId() { return userId; }
//     public void setUserId(String userId) { this.userId = userId; }

//     public String getRegistrationJson() { return registrationJson; }
//     public void setRegistrationJson(String registrationJson) { this.registrationJson = registrationJson; }

//     public UserRole getRole() { return role; }
//     public void setRole(UserRole role) { this.role = role; }

//     public LocalDateTime getCreatedAt() { return createdAt; }
//     public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
// }

package com.pulseiq.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "registration_data", schema = "pulseiq")
public class RegistrationData {
    @Id
    private String userId;

    // Option 1: Use @Lob without columnDefinition (Recommended)
    // @Lob
    // private String registrationJson;

    // Option 2: If you want to explicitly specify TEXT type for PostgreSQL
    @Column(columnDefinition = "text")
    private String registrationJson;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // Constructors
    public RegistrationData() {
    }

    public RegistrationData(String userId, String registrationJson, UserRole role) {
        this.userId = userId;
        this.registrationJson = registrationJson;
        this.role = role;
    }

    // Getters and setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRegistrationJson() {
        return registrationJson;
    }

    public void setRegistrationJson(String registrationJson) {
        this.registrationJson = registrationJson;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}