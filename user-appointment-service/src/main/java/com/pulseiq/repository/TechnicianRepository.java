package com.pulseiq.repository;

import com.pulseiq.entity.Technician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TechnicianRepository extends JpaRepository<Technician, String> {
    boolean existsByTechnicianId(String technicianId);
    Optional<Technician> findByTechnicianId(String technicianId);
}