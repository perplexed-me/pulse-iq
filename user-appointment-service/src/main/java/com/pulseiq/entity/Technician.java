package com.pulseiq.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "technicians", schema = "pulseiq")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Technician {

    @Id
    @Column(name = "technician_id", columnDefinition = "VARCHAR(255)")
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private String technicianId;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(nullable = false, length = 100)
    private String specialization;

    // Collection: Test results uploaded by this technician
    @OneToMany(mappedBy = "technician", fetch = FetchType.LAZY)
    private List<TestResult> uploadedTestResults = new ArrayList<>();
}
