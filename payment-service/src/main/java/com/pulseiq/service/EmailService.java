package com.pulseiq.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.name}")
    private String fromName;

    public void sendOtpEmail(String toEmail, String customerName, String otpCode, String transactionId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Payment OTP Verification - Transaction " + transactionId);

            String htmlContent = createOtpEmailContent(customerName, otpCode, transactionId);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("OTP email sent successfully to: {}", toEmail);

        } catch (Exception e) {
            logger.error("Failed to send OTP email to: " + toEmail, e);
        }
    }

    public void sendSimpleOtpEmail(String toEmail, String customerName, String otpCode, String transactionId) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Payment OTP Verification - Transaction " + transactionId);
            
            String content = String.format(
                "Dear %s,\n\n" +
                "Your OTP for payment verification is: %s\n\n" +
                "Transaction ID: %s\n" +
                "This OTP is valid for 10 minutes.\n\n" +
                "Please do not share this OTP with anyone.\n\n" +
                "Thank you,\n" +
                "PulseIQ Payment System",
                customerName, otpCode, transactionId
            );
            
            message.setText(content);
            mailSender.send(message);
            logger.info("Simple OTP email sent successfully to: {}", toEmail);

        } catch (Exception e) {
            logger.error("Failed to send simple OTP email to: " + toEmail, e);
        }
    }

    private String createOtpEmailContent(String customerName, String otpCode, String transactionId) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                    .container { background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
                    .otp-box { background-color: #f8f9fa; border: 2px dashed #4CAF50; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 8px; margin: 10px 0; }
                    .info { background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
                    .warning { background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Payment OTP Verification</h1>
                        <p>PulseIQ Payment System</p>
                    </div>
                    
                    <p>Dear <strong>%s</strong>,</p>
                    
                    <p>You have initiated a payment transaction. Please use the following One-Time Password (OTP) to complete your payment:</p>
                    
                    <div class="otp-box">
                        <p><strong>Your OTP Code:</strong></p>
                        <div class="otp-code">%s</div>
                    </div>
                    
                    <div class="info">
                        <strong>Transaction Details:</strong><br>
                        Transaction ID: %s<br>
                        Valid for: 10 minutes
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong><br>
                        • This OTP is confidential and should not be shared with anyone<br>
                        • Our team will never ask for your OTP over phone or email<br>
                        • If you didn't initiate this transaction, please contact us immediately
                    </div>
                    
                    <p>Please enter this OTP in the payment verification page to proceed with your transaction.</p>
                    
                    <div class="footer">
                        <p>Thank you for using PulseIQ Payment System</p>
                        <p><small>This is an automated message. Please do not reply to this email.</small></p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(customerName, otpCode, transactionId);
    }
}
