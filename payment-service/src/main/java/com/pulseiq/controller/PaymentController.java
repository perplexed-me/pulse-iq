package com.pulseiq.controller;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulseiq.dto.PaymentReceiptDto;
import com.pulseiq.dto.PaymentRequestDto;
import com.pulseiq.dto.PaymentResponseDto;
import com.pulseiq.entity.Payment;
import com.pulseiq.entity.PaymentStatus;
import com.pulseiq.repository.PaymentRepository;
import com.pulseiq.service.PdfReceiptService;
import com.pulseiq.service.SimpleNotificationService;
import com.pulseiq.service.SslcommerzService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/payments")
// @CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Value("${frontend.origin:http://132.196.64.104:8080}")
    private String frontendOrigin;

    @Value("${public.ip:132.196.64.104}")
    private String publicIp;

    @Autowired
    private SslcommerzService sslcommerzService;

    @Autowired
    private SimpleNotificationService notificationService;

    @Autowired
    private PdfReceiptService pdfReceiptService;

    @Autowired
    private PaymentRepository paymentRepository;


    @PostMapping("/success")
    public ResponseEntity<?> paymentSuccess(HttpServletRequest request) {
        try {
            logger.info("Payment success callback received");

            // Extract all parameters from the request
            Map<String, String> responseData = new HashMap<>();
            request.getParameterMap().forEach((key, values) -> {
                if (values.length > 0) {
                    responseData.put(key, values[0]);
                }
            });
            logger.info("Payment success data: {}", responseData); // Use validatePayment instead of
                                                                   // markPaymentAsCompleted to ensure proper processing
            String transactionId = responseData.get("tran_id");
            if (transactionId != null) {
                try {
                    // First validate the payment with SSLCOMMERZ
                    sslcommerzService.validatePayment(responseData);
                    
                    // Then save/update the payment record with the response data
                    savePaymentFromResponse(responseData);
                    
                    logger.info("Payment validated and completed for transaction: {}", transactionId);
                } catch (Exception e) {
                    logger.warn("Could not validate payment, but proceeding with success redirect", e);
                }
            }

            // Always redirect to frontend success page
            String redirectUrl = frontendOrigin + "/result/success";
            if (transactionId != null) {
                redirectUrl += "?tran_id=" + transactionId;
            }
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(redirectUrl))
                    .build();
        } catch (Exception e) {
            logger.error("Error processing payment success", e);
            // Still redirect to success since SSLCOMMERZ called the success endpoint
            String redirectUrl = frontendOrigin + "/result/success";
            String transactionId = request.getParameter("tran_id");
            if (transactionId != null) {
                redirectUrl += "?tran_id=" + transactionId;
            }
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(redirectUrl))
                    .build();
        }
    }

    @PostMapping("/fail")
    public ResponseEntity<?> paymentFail(HttpServletRequest request) {
        try {
            logger.info("Payment fail callback received");

            // Extract all parameters from the request
            Map<String, String> responseData = new HashMap<>();
            request.getParameterMap().forEach((key, values) -> {
                if (values.length > 0) {
                    responseData.put(key, values[0]);
                }
            });
            logger.info("Payment fail data: {}", responseData);

            // Validate and process the payment
            sslcommerzService.validatePayment(responseData);

            // Redirect to frontend failure page
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendOrigin + "/result/fail"))
                    .build();
        } catch (Exception e) {
            logger.error("Error processing payment fail", e);
            // Redirect to frontend failure page on error
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendOrigin + "/result/fail"))
                    .build();
        }
    }


    @GetMapping("/receipt/{transactionId}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable String transactionId) {
        try {
            logger.info("Generating receipt for transaction: {}", transactionId);
            
            // Get payment details from database
            List<Payment> payments = paymentRepository.findByTransactionIdOrderByCreatedAtDesc(transactionId);
            if (payments.isEmpty()) {
                logger.warn("Payment not found for transaction ID: {}", transactionId);
                return ResponseEntity.notFound().build();
            }
            
            // Use the most recent payment if there are duplicates
            Payment payment = payments.get(0);
            PaymentReceiptDto receipt = convertToReceiptDto(payment);
            
            // Generate PDF
            byte[] pdfBytes = pdfReceiptService.generatePaymentReceipt(receipt);
            
            // Prepare response headers
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                org.springframework.http.ContentDisposition.attachment()
                    .filename("payment-receipt-" + transactionId + ".pdf")
                    .build()
            );
            headers.setContentLength(pdfBytes.length);
            
            logger.info("PDF receipt generated successfully for transaction: {}", transactionId);
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            logger.error("Error generating receipt for transaction: " + transactionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private PaymentReceiptDto convertToReceiptDto(Payment payment) {
        PaymentReceiptDto receipt = new PaymentReceiptDto();
        receipt.setTransactionId(payment.getTransactionId());
        receipt.setCustomerName(payment.getCustomerName());
        receipt.setCustomerEmail(payment.getCustomerEmail());
        receipt.setCustomerPhone(payment.getCustomerPhone());
        receipt.setCustomerAddress(payment.getCustomerAddress());
        receipt.setAmount(payment.getAmount());
        receipt.setCurrency(payment.getCurrency());
        receipt.setDescription(payment.getDescription());
        receipt.setStatus(payment.getStatus() != null ? formatStatus(payment.getStatus().toString()) : "Completed");
        receipt.setPaymentMethod(payment.getPaymentMethod());
        receipt.setTransactionTime(payment.getCreatedAt());
        receipt.setCreatedAt(payment.getCreatedAt());
        
        return receipt;
    }

    @PostMapping("/create-test-payment")
    public ResponseEntity<?> createTestPayment(@RequestBody(required = false) Map<String, Object> requestData) {
        try {
            // Require user-provided data; do not use defaults
            if (requestData == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Request data is required to create a test payment.");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            Payment testPayment = new Payment();
            // Use custom transaction ID if provided, otherwise generate one
            String customTransactionId = (String) requestData.get("customTransactionId");
            if (customTransactionId != null && !customTransactionId.trim().isEmpty()) {
                // Check if transaction ID already exists
                Optional<Payment> existingPayment = paymentRepository.findByTransactionId(customTransactionId);
                if (existingPayment.isPresent()) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("success", false);
                    errorResponse.put("error", "Transaction ID already exists: " + customTransactionId);
                    errorResponse.put("existingTransactionId", customTransactionId);
                    return ResponseEntity.badRequest().body(errorResponse);
                }
                testPayment.setTransactionId(customTransactionId);
            } else {
                testPayment.setTransactionId("TEST_PDF_" + System.currentTimeMillis());
            }

            testPayment.setCustomerName((String) requestData.getOrDefault("customerName", "John Doe"));
            testPayment.setCustomerEmail((String) requestData.getOrDefault("customerEmail", "john.doe@example.com"));
            testPayment.setCustomerPhone((String) requestData.getOrDefault("customerPhone", "+1234567890"));
            testPayment.setCustomerAddress((String) requestData.getOrDefault("customerAddress", "123 Test Street, Test City, Test Country"));
            testPayment.setAmount(new java.math.BigDecimal(requestData.getOrDefault("amount", "99.99").toString()));
            testPayment.setCurrency((String) requestData.getOrDefault("currency", "USD"));
            testPayment.setDescription((String) requestData.getOrDefault("description", "Test Payment for PDF Receipt"));
            testPayment.setPaymentMethod((String) requestData.getOrDefault("paymentMethod", "Test Card"));

            testPayment.setStatus(com.pulseiq.entity.PaymentStatus.COMPLETED);
            testPayment.setCreatedAt(java.time.LocalDateTime.now());

            Payment savedPayment = paymentRepository.save(testPayment);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("transactionId", savedPayment.getTransactionId());
            response.put("message", "Test payment created successfully");
            response.put("pdfTestUrl", "/payments/receipt/" + savedPayment.getTransactionId());

            logger.info("Test payment created with transaction ID: {}", savedPayment.getTransactionId());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error creating test payment", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to create test payment: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/initiate-direct")
    public ResponseEntity<?> initiatePaymentDirect(@Valid @RequestBody PaymentRequestDto paymentRequest) {
        try {
            logger.info("Initiating direct payment for customer: {}", paymentRequest.getCustomerEmail());

            // Generate transaction ID
            String transactionId = sslcommerzService.generateTransactionId();
            
            // Generate and send confirmation email (no verification required)
            String confirmationCode = notificationService.sendPaymentConfirmation(transactionId, paymentRequest.getCustomerEmail(), paymentRequest.getCustomerName());
            logger.info("Confirmation code sent to email for transaction: {}, Code: {}", transactionId, confirmationCode);
            
            // Directly initiate payment with SSLCOMMERZ
            PaymentResponseDto response = sslcommerzService.initiatePaymentDirectWithTransactionId(paymentRequest, transactionId);
            
            if (response.isSuccess()) {
                logger.info("Direct payment initiated successfully. Transaction ID: {}", response.getTransactionId());
                return ResponseEntity.ok(response);
            } else {
                logger.error("Direct payment initiation failed. Error: {}", response.getError());
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error initiating direct payment", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to initiate payment: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    private void savePaymentFromResponse(Map<String, String> responseData) {
        try {
            String transactionId = responseData.get("tran_id");
            if (transactionId == null) return;
            
            // Check if payment already exists
            Optional<Payment> existingPayment = paymentRepository.findByTransactionId(transactionId);
            Payment payment;
            
            if (existingPayment.isPresent()) {
                // Update existing payment
                payment = existingPayment.get();
                logger.info("Updating existing payment for transaction: {}", transactionId);
            } else {
                // Create new payment record
                payment = new Payment();
                payment.setTransactionId(transactionId);
                logger.info("Creating new payment record for transaction: {}", transactionId);
            }
            
            // Update payment with SSLCOMMERZ response data
            payment.setStatus(PaymentStatus.COMPLETED);
            
            // Extract customer info from SSLCOMMERZ response
            if (responseData.get("cus_name") != null) {
                payment.setCustomerName(responseData.get("cus_name"));
            }
            if (responseData.get("cus_email") != null) {
                payment.setCustomerEmail(responseData.get("cus_email"));
            }
            if (responseData.get("cus_phone") != null) {
                payment.setCustomerPhone(responseData.get("cus_phone"));
            }
            if (responseData.get("cus_add1") != null) {
                payment.setCustomerAddress(responseData.get("cus_add1"));
            }
            
            // Extract payment details
            if (responseData.get("amount") != null) {
                payment.setAmount(new BigDecimal(responseData.get("amount")));
            }
            if (responseData.get("currency") != null) {
                payment.setCurrency(responseData.get("currency"));
            }
            if (responseData.get("value_a") != null) {
                payment.setDescription(responseData.get("value_a")); // Description is often sent in value_a
            }
            
            if (payment.getCreatedAt() == null) {
                payment.setCreatedAt(LocalDateTime.now());
            }
            
            // Save the payment
            paymentRepository.save(payment);
            logger.info("Payment data saved successfully for transaction: {}", transactionId);
            
        } catch (Exception e) {
            logger.error("Error saving payment data from response: ", e);
        }
    }
    
    /**
     * Format status to proper case (e.g., "COMPLETED" -> "Completed")
     */
    private String formatStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return "Unknown";
        }
        String lowerCase = status.toLowerCase();
        return lowerCase.substring(0, 1).toUpperCase() + lowerCase.substring(1);
    }
}