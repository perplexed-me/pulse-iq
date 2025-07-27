package com.pulseiq.repository;

import com.pulseiq.entity.Payment;
import com.pulseiq.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

        Optional<Payment> findByTransactionId(String transactionId);
        
        List<Payment> findByTransactionIdOrderByCreatedAtDesc(String transactionId);

        List<Payment> findByCustomerEmail(String customerEmail);

        List<Payment> findByStatus(PaymentStatus status);

        List<Payment> findByCustomerEmailAndStatus(String customerEmail, PaymentStatus status);

        // Using Spring Data JPA method names instead of JPQL for simple queries
        List<Payment> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

        List<Payment> findByCustomerEmailAndCreatedAtBetween(String customerEmail, LocalDateTime startDate,
                        LocalDateTime endDate);

        // All using Spring Data JPA method names - no JPQL needed
        long countByStatus(PaymentStatus status);

        // Note: Spring Data JPA doesn't support sumBy... method names directly
        // You would need to use @Query or implement these in a service layer
        @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = :status")
        java.math.BigDecimal sumAmountByStatus(@Param("status") PaymentStatus status);

        @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = :status AND p.createdAt BETWEEN :startDate AND :endDate")
        java.math.BigDecimal sumAmountByStatusAndDateRange(@Param("status") PaymentStatus status,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);
}