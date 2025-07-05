package com.pulseiq.repository;

import com.pulseiq.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, String> {
    boolean existsByAdminId(String adminId);
}