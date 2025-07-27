package com.pulseiq.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@pulseiq.com}")
    private String fromEmail;

    @Value("${app.email.name:PulseIQ Report Access}")
    private String fromName;

    /**
     * Send OTP email to patient for test result access verification
     */
    public void sendOtpEmail(String patientEmail, String patientName, String otp) {
        try {
            log.info("=== Email Service Started ===");
            log.info("Recipient: {} <{}>", patientName, patientEmail);
            log.info("OTP: {}", otp);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail, fromName);
            helper.setTo(patientEmail);
            helper.setSubject("Test Result Access Verification - PulseIQ");

            String htmlContent = buildOtpEmailContent(patientName, otp);
            helper.setText(htmlContent, true);
            
            log.info("Attempting to send email...");
            mailSender.send(message);
            log.info("=== Email Sent Successfully ===");

        } catch (MessagingException e) {
            log.error("=== Email Send Failed ===");
            log.error("Failed to send OTP email to: {}", patientEmail, e);
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        } catch (Exception e) {
            log.error("=== Email Send Failed (General Error) ===");
            log.error("Unexpected error sending OTP email to: {}", patientEmail, e);
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }

    /**
     * Build HTML content for OTP email
     */
    private String buildOtpEmailContent(String patientName, String otp) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                    "<style>" +
                        "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }" +
                        ".container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }" +
                        ".header { text-align: center; margin-bottom: 30px; }" +
                        ".logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }" +
                        ".otp-code { font-size: 32px; font-weight: bold; color: #1e40af; background-color: #eff6ff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; letter-spacing: 3px; }" +
                        ".warning { background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }" +
                        ".footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }" +
                    "</style>" +
                "</head>" +
                "<body>" +
                    "<div class='container'>" +
                        "<div class='header'>" +
                            "<div class='logo'>🩺 PulseIQ</div>" +
                            "<h2 style='color: #374151; margin: 0;'>Test Result Access Verification</h2>" +
                        "</div>" +
                        
                        "<p>Dear " + patientName + ",</p>" +
                        
                        "<p>A doctor is requesting access to your test results. For your privacy and security, please provide the following verification code:</p>" +
                        
                        "<div class='otp-code'>" + otp + "</div>" +
                        
                        "<div class='warning'>" +
                            "<strong>⚠️ Important Security Information:</strong>" +
                            "<ul style='margin: 10px 0; padding-left: 20px;'>" +
                                "<li>This code expires in <strong>10 minutes</strong></li>" +
                                "<li>Only share this code with the doctor you are currently meeting</li>" +
                                "<li>Never share this code via email or phone</li>" +
                                "<li>If you did not request this, please contact our support team immediately</li>" +
                            "</ul>" +
                        "</div>" +
                        
                        "<p>Thank you for using PulseIQ for your healthcare needs.</p>" +
                        
                        "<div class='footer'>" +
                            "<p>This is an automated message from PulseIQ Healthcare System</p>" +
                            "<p>Please do not reply to this email</p>" +
                        "</div>" +
                    "</div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Send OTP email to patient for specific test type access verification
     */
    public void sendOtpEmailForTestType(String patientEmail, String patientName, String otp, String testType) {
        try {
            log.info("=== Test Type Email Service Started ===");
            log.info("Recipient: {} <{}>, Test Type: {}", patientName, patientEmail, testType);
            log.info("OTP: {}", otp);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail, fromName);
            helper.setTo(patientEmail);
            helper.setSubject("Access Request for " + testType + " Results - PulseIQ");

            String htmlContent = buildOtpEmailContentForTestType(patientName, otp, testType);
            helper.setText(htmlContent, true);
            
            log.info("Attempting to send test type email...");
            mailSender.send(message);
            log.info("=== Test Type Email Sent Successfully ===");

        } catch (MessagingException e) {
            log.error("=== Test Type Email Send Failed ===");
            log.error("Failed to send test type OTP email to: {}", patientEmail, e);
            throw new RuntimeException("Failed to send test type OTP email: " + e.getMessage());
        } catch (Exception e) {
            log.error("=== Unexpected Error ===");
            log.error("Unexpected error while sending test type OTP email to: {}", patientEmail, e);
            throw new RuntimeException("Unexpected error sending test type OTP email: " + e.getMessage());
        }
    }

    private String buildOtpEmailContentForTestType(String patientName, String otp, String testType) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                    "<style>" +
                        "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }" +
                        ".container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }" +
                        ".header { color: #2563eb; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }" +
                        ".otp-code { background-color: #dbeafe; color: #1e40af; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px dashed #3b82f6; letter-spacing: 4px; }" +
                        ".warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }" +
                        ".footer { color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; }" +
                        ".test-type { background-color: #f0f9ff; color: #0c4a6e; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; margin: 15px 0; }" +
                    "</style>" +
                "</head>" +
                "<body>" +
                    "<div class='container'>" +
                        "<div class='header'>🏥 PulseIQ Healthcare</div>" +
                        
                        "<p>Dear " + patientName + ",</p>" +
                        
                        "<p>A doctor is requesting access to your <strong>" + testType + "</strong> test results. For your privacy and security, please provide the following verification code:</p>" +
                        
                        "<div class='test-type'>Requested Test Type: " + testType + "</div>" +
                        
                        "<div class='otp-code'>" + otp + "</div>" +
                        
                        "<div class='warning'>" +
                            "<strong>⚠️ Important Security Information:</strong>" +
                            "<ul style='margin: 10px 0; padding-left: 20px;'>" +
                                "<li>This code expires in <strong>10 minutes</strong></li>" +
                                "<li>This code is specifically for <strong>" + testType + "</strong> results only</li>" +
                                "<li>Only share this code with the doctor you are currently meeting</li>" +
                                "<li>Never share this code via email or phone</li>" +
                                "<li>If you did not request this, please contact our support team immediately</li>" +
                            "</ul>" +
                        "</div>" +
                        
                        "<p>Thank you for using PulseIQ for your healthcare needs.</p>" +
                        
                        "<div class='footer'>" +
                            "<p>This is an automated message from PulseIQ Healthcare System</p>" +
                            "<p>Please do not reply to this email</p>" +
                        "</div>" +
                    "</div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Send simple test email (for testing email configuration)
     */
    public void sendTestEmail(String toEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Test Email - PulseIQ System");
            helper.setText("This is a test email from PulseIQ system. If you receive this, email configuration is working correctly.");

            mailSender.send(message);
            log.info("Test email sent successfully to: {}", toEmail);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send test email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send test email: " + e.getMessage());
        }
    }
}
