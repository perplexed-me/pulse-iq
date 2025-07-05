package com.pulseiq.config;

import com.pulseiq.entity.Admin;
import com.pulseiq.entity.User;
import com.pulseiq.entity.UserRole;
import com.pulseiq.entity.UserStatus;
import com.pulseiq.repository.AdminRepository;
import com.pulseiq.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements ApplicationListener<ApplicationReadyEvent> {

    private final UserRepository  userRepository;
    private final AdminRepository adminRepository;

    @Override
    @Transactional
    public void onApplicationEvent(ApplicationReadyEvent event) {

        final String userId = "A202506001";

        if (userRepository.findByUserId(userId).isEmpty()) {

            // ─── create User ─────────────────────────────────────────
            User user = new User();
            user.setUserId(userId);
            user.setUsername("super_admin");
            user.setPassword(
                "$2a$12$E4.9tTLvehv4NOghm5mqROfyvfCOdY962drt8sfZeNC47k0ztCNFS"); // bcrypt of admin123
            user.setEmail("admin@pulseiq.com");
            user.setPhone("01800000000");
            user.setRole(UserRole.ADMIN);
            user.setStatus(UserStatus.ACTIVE);

            userRepository.save(user);

            // ─── create Admin ───────────────────────────────────────
            Admin admin = new Admin();
            admin.setAdminId(userId);
            admin.setFirstName("Super");
            admin.setLastName("Admin");
            // admin.setUser(user);  // uncomment if you have a relation

            adminRepository.save(admin);

            log.info("Default admin user seeded.");
        } else {
            log.info("Default admin user already exists.");
        }
    }
}
