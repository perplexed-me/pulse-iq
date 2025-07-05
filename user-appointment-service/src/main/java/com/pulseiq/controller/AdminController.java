// package com.pulseiq.controller;

// import java.util.List;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.CrossOrigin;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PathVariable;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RestController;

// import com.pulseiq.entity.User;
// import com.pulseiq.entity.UserStatus;
// import com.pulseiq.repository.UserRepository;

// @RestController
// @RequestMapping("/api/admin")
// //@CrossOrigin//(origins = "*")
// public class AdminController {
//     @Autowired
//     private UserRepository userRepo;

//     @GetMapping("/pending")
//     public List<User> getPending() {
//         //System.out.println(userRepo.findAllByStatus(UserStatus.PENDING).size());
//         return userRepo.findAllByStatus(UserStatus.PENDING);
//     }

//     @GetMapping("/approved")
//     public List<User> getApproved() {
//         return userRepo.findAllByStatus(UserStatus.ACTIVE);
//     }

//     @GetMapping("/rejected")
//     public List<User> getRejected() {
//         return userRepo.findAllByStatus(UserStatus.REJECTED);
//     }

//     @PostMapping("/approve/{id}")
//     public ResponseEntity<String> approve(@PathVariable Long id) {
//         User user = userRepo.findById(id).orElseThrow();
//         user.setStatus(UserStatus.ACTIVE);
//         userRepo.save(user);
//         return ResponseEntity.ok("User approved");
//     }

//     @PostMapping("/reject/{id}")
//     public ResponseEntity<String> reject(@PathVariable Long id) {
//         User user = userRepo.findById(id).orElseThrow();
//         user.setStatus(UserStatus.REJECTED);
//         userRepo.save(user);
//         return ResponseEntity.ok("User rejected");
//     }
// }


package com.pulseiq.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulseiq.entity.User;
import com.pulseiq.entity.UserStatus;
import com.pulseiq.repository.UserRepository;
import com.pulseiq.service.UserService;

// @RestController
// @RequestMapping("/api/admin")
// //@CrossOrigin//(origins = "*")
// public class AdminController {
//     @Autowired
//     private UserRepository userRepo;
    
//     @Autowired
//     private UserService userService;

//     @GetMapping("/pending")
//     public List<User> getPending() {
//         //System.out.println(userRepo.findAllByStatus(UserStatus.PENDING).size());
//         return userRepo.findAllByStatus(UserStatus.PENDING);
//     }

//     @GetMapping("/approved")
//     public List<User> getApproved() {
//         return userRepo.findAllByStatus(UserStatus.ACTIVE);
//     }

//     @GetMapping("/rejected")
//     public List<User> getRejected() {
//         return userRepo.findAllByStatus(UserStatus.REJECTED);
//     }

//     @PostMapping("/approve/{userId}")
//     public ResponseEntity<String> approve(@PathVariable String userId) {
//         try {
//             // Note: You'll need to retrieve the original registration data
//             // This is a simplified approach - in practice, you'd store and retrieve
//             // the registration data from a temporary table
//             userService.approveUser(userId, null);
//             return ResponseEntity.ok("User approved successfully");
//         } catch (RuntimeException e) {
//             return ResponseEntity.badRequest().body("Error approving user: " + e.getMessage());
//         }
//     }

//     @PostMapping("/reject/{userId}")
//     public ResponseEntity<String> reject(@PathVariable String userId) {
//         try {
//             userService.rejectUser(userId);
//             return ResponseEntity.ok("User rejected successfully");
//         } catch (RuntimeException e) {
//             return ResponseEntity.badRequest().body("Error rejecting user: " + e.getMessage());
//         }
//     }
// }

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