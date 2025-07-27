package com.pulseiq.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class SimpleNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(SimpleNotificationService.class);
    private static final SecureRandom random = new SecureRandom();

    @Autowired
    private EmailService emailService;

    /**
     * Generates a confirmation code and sends it to customer email for notification purposes only.
     * No verification required - this is just for customer confirmation/records.
     */
    public String sendPaymentConfirmation(String transactionId, String customerEmail, String customerName) {
        // Generate 6-digit confirmation code
        String confirmationCode = String.format("%06d", random.nextInt(1000000));
        
        logger.info("=== PAYMENT CONFIRMATION ===");
        logger.info("Transaction ID: {}", transactionId);
        logger.info("Customer Email: {}", customerEmail);
        logger.info("Confirmation Code: {}", confirmationCode);
        
        // Send confirmation email
        try {
            emailService.sendOtpEmail(customerEmail, customerName, confirmationCode, transactionId);
            logger.info("Payment confirmation email sent successfully to: {}", customerEmail);
        } catch (Exception e) {
            logger.error("Failed to send confirmation email to: " + customerEmail, e);
            // Fallback to simple email
            try {
                emailService.sendSimpleOtpEmail(customerEmail, customerName, confirmationCode, transactionId);
                logger.info("Fallback confirmation email sent to: {}", customerEmail);
            } catch (Exception fallbackException) {
                logger.error("Failed to send fallback confirmation email to: " + customerEmail, fallbackException);
            }
        }
        
        return confirmationCode;
    }
}
