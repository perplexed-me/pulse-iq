package com.pulseiq.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "doctors", schema = "pulseiq")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @Column(name = "doctor_id", columnDefinition = "VARCHAR(255)")
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private String doctorId;

    // 🔗 Reference to User - REMOVED to avoid conflicts
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "doctor_id", referencedColumnName = "userId", insertable =
    // false, updatable = false)
    // private User user;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(nullable = false, length = 100)
    private String specialization;

    @Column(nullable = false, length = 100)
    private String degree;

    @Column(name = "license_number", unique = true, nullable = false, length = 50)
    private String licenseNumber;

    // Removed assistant fields as they are not used
    // @Column(name = "assistant_name", length = 50)
    // private String assistantName;
    // @Pattern(regexp = "01\\d{9}")
    // @Column(name = "assistant_number", unique = true, length = 11)
    // private String assistantNumber;

    @Column(name = "consultation_fee")
    private BigDecimal consultationFee = BigDecimal.ZERO;

    @Column(name = "is_available")
    private Boolean isAvailable = true;

    // Available days (comma-separated list like "MONDAY,TUESDAY,FRIDAY")
    @Column(name = "available_days", length = 200)
    private String availableDays;

    // Available time range (like "09:00-17:00")
    @Column(name = "available_time_start", length = 10)
    private String availableTimeStart;

    @Column(name = "available_time_end", length = 10) 
    private String availableTimeEnd;

    @Lob
    // @Column(name = "profile_picture", columnDefinition = "LONGVARBINARY")
    // @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "profile_picture")
    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
    private byte[] profilePicture;

    @Column(name = "profile_picture_type", length = 50)
    private String profilePictureType;

    // Collection: Test results ordered by this doctor
    @OneToMany(mappedBy = "doctor", fetch = FetchType.LAZY)
    private List<TestResult> orderedTestResults = new ArrayList<>();

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getDegree() {
        return degree;
    }

    public void setDegree(String degree) {
        this.degree = degree;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public BigDecimal getConsultationFee() {
        return consultationFee;
    }

    public void setConsultationFee(BigDecimal consultationFee) {
        this.consultationFee = consultationFee;
    }

    public String getAvailableDays() {
        return availableDays;
    }

    public void setAvailableDays(String availableDays) {
        this.availableDays = availableDays;
    }

    public String getAvailableTimeStart() {
        return availableTimeStart;
    }

    public void setAvailableTimeStart(String availableTimeStart) {
        this.availableTimeStart = availableTimeStart;
    }

    public String getAvailableTimeEnd() {
        return availableTimeEnd;
    }

    public void setAvailableTimeEnd(String availableTimeEnd) {
        this.availableTimeEnd = availableTimeEnd;
    }

    public Boolean getAvailable() {
        return isAvailable;
    }

    public void setAvailable(Boolean available) {
        isAvailable = available;
    }

    public byte[] getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(byte[] profilePicture) {
        this.profilePicture = profilePicture;
    }

    public String getProfilePictureType() {
        return profilePictureType;
    }

    public void setProfilePictureType(String profilePictureType) {
        this.profilePictureType = profilePictureType;
    }
}
