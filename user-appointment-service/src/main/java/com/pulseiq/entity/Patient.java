package com.pulseiq.entity;

import com.pulseiq.converter.BloodGroupConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patients", schema = "pulseiq")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

    @Id
    @Column(name = "patient_id", columnDefinition = "VARCHAR(255)")
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private String patientId;

    // 🔗 Reference to User - REMOVED to avoid conflicts
    // @OneToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "patient_id", referencedColumnName = "userId", insertable
    // = false, updatable = false)
    // private User user;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Min(1)
    @Max(109)
    @Column(nullable = false)
    private Integer age;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Convert(converter = BloodGroupConverter.class)
    @Column(name = "blood_group", length = 5)
    private BloodGroup bloodGroup;

    @Column(name = "registration_date")
    private LocalDateTime registrationDate = LocalDateTime.now();

    // Collection: Test results for this patient
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY)
    private List<TestResult> testResults = new ArrayList<>();

    public enum Gender {
        Male, Female, Other
    }

    public enum BloodGroup {
        A_POSITIVE("A+"), A_NEGATIVE("A-"),
        B_POSITIVE("B+"), B_NEGATIVE("B-"),
        AB_POSITIVE("AB+"), AB_NEGATIVE("AB-"),
        O_POSITIVE("O+"), O_NEGATIVE("O-");

        private final String value;

        BloodGroup(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }
}
