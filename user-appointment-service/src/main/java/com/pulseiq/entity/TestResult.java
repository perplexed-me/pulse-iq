package com.pulseiq.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_results", schema = "pulseiq")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "test_id")
    private Long testId;

    @Column(name = "test_name", nullable = false, length = 100)
    @NotBlank(message = "Test name is required")
    private String testName;

    @Column(name = "test_type", nullable = false, length = 50)
    @NotBlank(message = "Test type is required")
    private String testType;

    @Column(name = "description", length = 500)
    private String description;

    // PDF file stored as binary data
    @Lob
    @Column(name = "pdf_data", nullable = false)
    @NotNull(message = "PDF data is required")
    private byte[] pdfData;

    @Column(name = "pdf_filename", nullable = false, length = 255)
    @NotBlank(message = "PDF filename is required")
    private String pdfFilename;

    @Column(name = "file_size")
    private Long fileSize;

    // Foreign Key: Patient who this test belongs to
    @Column(name = "patient_id", nullable = false)
    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", referencedColumnName = "patient_id", insertable = false, updatable = false)
    private Patient patient;

    // Foreign Key: Doctor who ordered this test
    @Column(name = "doctor_id", nullable = false)
    @NotBlank(message = "Doctor ID is required")
    private String doctorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", referencedColumnName = "doctor_id", insertable = false, updatable = false)
    private Doctor doctor;

    // Foreign Key: Technician who uploaded this test result
    @Column(name = "technician_id", nullable = false)
    @NotBlank(message = "Technician ID is required")
    private String technicianId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", referencedColumnName = "technician_id", insertable = false, updatable = false)
    private Technician technician;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @Column(name = "test_date")
    private LocalDateTime testDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TestStatus status = TestStatus.COMPLETED;

    @Column(name = "notes", length = 1000)
    private String notes;

    public enum TestStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        REVIEWED,
        CANCELLED
    }
}
