package com.pulseiq.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulseiq.entity.User;
import com.pulseiq.entity.UserStatus;
import com.pulseiq.repository.UserRepository;
import com.pulseiq.service.UserService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private UserRepository userRepo;
    
    @Autowired
    private UserService userService;

    @GetMapping("/pending")
    public List<User> getPending() {
        return userRepo.findAllByStatus(UserStatus.PENDING);
    }

    @GetMapping("/approved")
    public List<User> getApproved() {
        return userRepo.findAllByStatus(UserStatus.ACTIVE);
    }

    @GetMapping("/rejected")
    public List<User> getRejected() {
        return userRepo.findAllByStatus(UserStatus.REJECTED);
    }

    @PostMapping("/approve/{userId}")
    public ResponseEntity<String> approve(@PathVariable String userId) {
        try {
            userService.approveUser(userId); // Remove the null parameter
            return ResponseEntity.ok("User approved successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error approving user: " + e.getMessage());
        }
    }

    @PostMapping("/reject/{userId}")
    public ResponseEntity<String> reject(@PathVariable String userId) {
        try {
            userService.rejectUser(userId);
            return ResponseEntity.ok("User rejected successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error rejecting user: " + e.getMessage());
        }
    }
}