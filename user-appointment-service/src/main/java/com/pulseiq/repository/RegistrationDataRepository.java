package com.pulseiq.repository;

import com.pulseiq.entity.RegistrationData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RegistrationDataRepository extends JpaRepository<RegistrationData, String> {
    Optional<RegistrationData> findByUserId(String userId);
    void deleteByUserId(String userId);
}
