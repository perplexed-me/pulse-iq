package com.pulseiq.repository;

import com.pulseiq.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    List<User> findAllByStatus(UserStatus status);
    Optional<User> findByUserIdIgnoreCase(String userId);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findTopByUserIdStartingWithOrderByUserIdDesc(String prefix);
    Optional<User> findByUserId(String userId);


}
