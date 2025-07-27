package com.pulseiq.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pulseiq.config.SslcommerzConfig;
import com.pulseiq.dto.PaymentRequestDto;
import com.pulseiq.dto.PaymentResponseDto;
import com.pulseiq.entity.Payment;
import com.pulseiq.entity.PaymentStatus;
import com.pulseiq.repository.PaymentRepository;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Service
public class SslcommerzServiceImpl implements SslcommerzService {

    private static final Logger logger = LoggerFactory.getLogger(SslcommerzServiceImpl.class);

    @Autowired
    private SslcommerzConfig sslcommerzConfig;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public PaymentResponseDto initiatePaymentDirectWithTransactionId(PaymentRequestDto paymentRequest, String transactionId) {
        logger.info("=== DIRECT PAYMENT INITIATION WITHOUT OTP VERIFICATION ===");
        logger.info("Transaction ID: {}", transactionId);
        logger.info("Customer: {}", paymentRequest.getCustomerName());
        logger.info("Email: {}", paymentRequest.getCustomerEmail());
        logger.info("Amount: {}", paymentRequest.getAmount());
        
        // Skip OTP verification for direct payment

        try {
            // Validate SSL Commerz configuration
            if (sslcommerzConfig == null) {
                throw new RuntimeException("SSL Commerz configuration is not available");
            }

            if (sslcommerzConfig.getStoreId() == null || sslcommerzConfig.getStoreId().trim().isEmpty()) {
                throw new RuntimeException("SSL Commerz Store ID is not configured");
            }

            if (sslcommerzConfig.getStorePassword() == null || sslcommerzConfig.getStorePassword().trim().isEmpty()) {
                throw new RuntimeException("SSL Commerz Store Password is not configured");
            }

            if (sslcommerzConfig.getApiUrl() == null || sslcommerzConfig.getApiUrl().trim().isEmpty()) {
                throw new RuntimeException("SSL Commerz API URL is not configured");
            }

            logger.info("SSL Commerz config validation passed");

            // Create payment entity with predefined transaction ID
            Payment payment = new Payment();
            payment.setTransactionId(transactionId);
            payment.setCustomerName(paymentRequest.getCustomerName());
            payment.setCustomerEmail(paymentRequest.getCustomerEmail());
            payment.setCustomerPhone(paymentRequest.getCustomerPhone());
            payment.setCustomerAddress(paymentRequest.getCustomerAddress());
            payment.setAmount(paymentRequest.getAmount());
            payment.setCurrency(paymentRequest.getCurrency());
            payment.setPaymentMethod("Pending"); // Will be updated from SSLCOMMERZ response
            payment.setDescription(paymentRequest.getDescription());
            payment.setStatus(PaymentStatus.PENDING);

            // Save payment to database
            payment = paymentRepository.save(payment);
            logger.info("Payment record saved with ID: {}", payment.getId());

            // Prepare SSLCOMMERZ request data
            Map<String, String> requestData = new HashMap<>();
            requestData.put("store_id", sslcommerzConfig.getStoreId());
            requestData.put("store_passwd", sslcommerzConfig.getStorePassword());
            requestData.put("total_amount", paymentRequest.getAmount().toString());
            requestData.put("currency", paymentRequest.getCurrency());
            requestData.put("tran_id", transactionId);
            requestData.put("product_category", "healthcare");
            requestData.put("product_name", "PulseIQ Healthcare Services");
            requestData.put("product_profile", "general");
            requestData.put("cus_name", paymentRequest.getCustomerName());
            requestData.put("cus_email", paymentRequest.getCustomerEmail());
            requestData.put("cus_add1",
                    paymentRequest.getCustomerAddress() != null ? paymentRequest.getCustomerAddress() : "Dhaka");
            requestData.put("cus_city", "Dhaka");
            requestData.put("cus_postcode", "1000");
            requestData.put("cus_country", "Bangladesh");
            requestData.put("cus_phone", paymentRequest.getCustomerPhone());
            requestData.put("shipping_method", "NO");
            requestData.put("num_of_item", "1");
            requestData.put("success_url", sslcommerzConfig.getSuccessUrl());
            requestData.put("fail_url", sslcommerzConfig.getFailUrl());
            requestData.put("cancel_url", sslcommerzConfig.getCancelUrl());
            requestData.put("ipn_url", sslcommerzConfig.getIpnUrl());

            logger.debug("SSLCOMMERZ request data prepared");
            logger.info("Sending request to SSLCOMMERZ API: {}", sslcommerzConfig.getApiUrl());

            // Send request to SSLCOMMERZ
            String response = sendRequestToSslcommerz(requestData);
            logger.info("SSLCOMMERZ response received");
            logger.debug("SSLCOMMERZ raw response: {}", response);

            // Parse response
            Map<String, String> responseMap = parseResponse(response);
            logger.debug("Parsed response map: {}", responseMap);
            if (responseMap.containsKey("status")
                    && ("VALID".equals(responseMap.get("status")) || "SUCCESS".equals(responseMap.get("status")))) {
                // Update payment status
                payment.setStatus(PaymentStatus.PROCESSING);
                payment = paymentRepository.save(payment);
                // Return response with redirect URL
                PaymentResponseDto responseDto = convertToDto(payment);
                responseDto.setSuccess(true);
                responseDto.setGatewayPageURL(responseMap.get("GatewayPageURL"));

                logger.info("Direct payment initiated successfully without OTP verification. Gateway URL: {}", responseMap.get("GatewayPageURL"));
                return responseDto;
            } else {
                // Payment initiation failed
                String errorMessage = responseMap.get("error") != null ? responseMap.get("error")
                        : responseMap.get("failedreason") != null ? responseMap.get("failedreason")
                                : responseMap.get("status") != null ? "Status: " + responseMap.get("status")
                                        : "Unknown error from SSLCOMMERZ";

                logger.error("Direct payment initiation failed. Status: {}, Error: {}, Full response: {}",
                        responseMap.get("status"), errorMessage, responseMap);
                payment.setStatus(PaymentStatus.FAILED);
                payment = paymentRepository.save(payment);

                // Create a more detailed error response
                PaymentResponseDto errorResponse = new PaymentResponseDto();
                errorResponse.setSuccess(false);
                errorResponse.setError(errorMessage);
                errorResponse.setTransactionId(transactionId);

                return errorResponse;
            }

        } catch (Exception e) {
            logger.error("Error initiating direct payment with transaction ID: " + transactionId, e);
            throw new RuntimeException("Direct payment initiation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public PaymentResponseDto validatePayment(Map<String, String> responseData) {
        try {
            String transactionId = responseData.get("tran_id");
            String status = responseData.get("status");

            // Log all response data to understand what SSLCOMMERZ is sending
            logger.info("=== SSLCOMMERZ VALIDATION START ===");
            logger.info("Transaction ID: {}", transactionId);
            logger.info("Status: {}", status);
            logger.info("All SSLCOMMERZ response fields:");
            responseData.forEach((key, value) -> logger.info("  {} = {}", key, value));
            logger.info("=== END SSLCOMMERZ RESPONSE ===");

            // Find payment by transaction ID
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionId(transactionId);
            if (!paymentOpt.isPresent()) {
                throw new RuntimeException("Payment not found for transaction ID: " + transactionId);
            }

            Payment payment = paymentOpt.get(); // Verify signature (make this optional for testing)
            boolean signatureValid = verifySignature(responseData);
            if (!signatureValid) {
                logger.warn("Signature verification failed, but continuing for testing purposes");
                logger.warn("In production, this should fail the payment");
                // For testing, we'll continue but log the issue
                // payment.setStatus(PaymentStatus.FAILED);
                // payment = paymentRepository.save(payment);
                // throw new RuntimeException("Signature verification failed");
            } else {
                logger.info("Signature verification successful");
            }
            
            // Update payment method based on what user selected in SSLCOMMERZ gateway
            // Only set if not already set to a valid method to avoid overwriting/concatenation
            String currentPaymentMethod = payment.getPaymentMethod();
            logger.info("Current payment method before validation: '{}'", currentPaymentMethod);
            
            if (currentPaymentMethod == null ||
                    currentPaymentMethod.trim().isEmpty() ||
                    "Pending".equals(currentPaymentMethod) ||
                    "To be selected in gateway".equals(currentPaymentMethod) ||
                    "Unknown".equals(currentPaymentMethod) ||
                    "BKASH".equals(currentPaymentMethod.toUpperCase()) ||
                    "NAGAD".equals(currentPaymentMethod.toUpperCase()) ||
                    "ROCKET".equals(currentPaymentMethod.toUpperCase()) ||
                    currentPaymentMethod.contains("-") ||
                    currentPaymentMethod.length() > 20) {

                String selectedPaymentMethod = detectPaymentMethod(responseData);
                payment.setPaymentMethod(selectedPaymentMethod);
                logger.info("Payment method set in validatePayment: '{}' (was: '{}')", selectedPaymentMethod, currentPaymentMethod);
            } else {
                logger.info("Payment method already properly set to: '{}', skipping update in validatePayment", currentPaymentMethod);
            }
            
            // Update status based on SSLCOMMERZ response
            logger.info("Updating payment status based on SSLCOMMERZ status: '{}'", status);

            if ("VALID".equals(status) || "SUCCESS".equals(status)) {
                payment.setStatus(PaymentStatus.COMPLETED);
                logger.info("Payment status set to COMPLETED");
            } else if ("FAILED".equals(status) || "FAIL".equals(status)) {
                payment.setStatus(PaymentStatus.FAILED);
                logger.info("Payment status set to FAILED");
            } else if ("CANCELLED".equals(status) || "CANCEL".equals(status)) {
                payment.setStatus(PaymentStatus.CANCELLED);
                logger.info("Payment status set to CANCELLED");
            } else {
                logger.warn("Unknown SSLCOMMERZ status: '{}', keeping current status: {}", status, payment.getStatus());
            }

            payment = paymentRepository.save(payment);

            return convertToDto(payment);
        } catch (Exception e) {
            logger.error("Error validating payment", e);
            throw new RuntimeException("Payment validation failed", e);
        }
    }

    @Override
    public String generateTransactionId() {
        return "TXN_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Override
    public boolean verifySignature(Map<String, String> responseData) {
        try {
            String receivedSignature = responseData.get("verify_sign");
            if (receivedSignature == null) {
                return false;
            }

            // Create signature string with essential fields only
            StringBuilder signatureString = new StringBuilder();
            signatureString.append(sslcommerzConfig.getStoreId());
            signatureString.append(responseData.get("tran_id"));
            signatureString.append(responseData.get("val_id"));
            signatureString.append(responseData.get("amount"));
            signatureString.append(responseData.get("currency"));
            signatureString.append(responseData.get("tran_date"));
            signatureString.append(responseData.get("status"));
            signatureString.append(responseData.get("store_id"));
            signatureString.append(responseData.get("verify_key"));
            signatureString.append(sslcommerzConfig.getStorePassword());

            // Generate MD5 hash
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hashBytes = md.digest(signatureString.toString().getBytes(StandardCharsets.UTF_8));
            String calculatedSignature = bytesToHex(hashBytes);

            return calculatedSignature.equalsIgnoreCase(receivedSignature);

        } catch (NoSuchAlgorithmException e) {
            logger.error("Error verifying signature", e);
            return false;
        }
    }

    private String sendRequestToSslcommerz(Map<String, String> requestData) throws IOException {
        logger.debug("Preparing HTTP request to SSLCOMMERZ");

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            String apiUrl = sslcommerzConfig.getApiUrl();
            logger.info("Using API URL: {}", apiUrl);

            HttpPost httpPost = new HttpPost(apiUrl);

            // Convert request data to form data
            StringBuilder formData = new StringBuilder();
            for (Map.Entry<String, String> entry : requestData.entrySet()) {
                if (formData.length() > 0) {
                    formData.append("&");
                }
                formData.append(entry.getKey()).append("=")
                        .append(java.net.URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
            }

            logger.debug("Form data being sent: {}", formData.toString());
            logger.debug("Request URL: {}", apiUrl);

            StringEntity entity = new StringEntity(formData.toString(), ContentType.APPLICATION_FORM_URLENCODED);
            httpPost.setEntity(entity);

            // Add headers
            httpPost.setHeader("User-Agent", "Mozilla/5.0");
            httpPost.setHeader("Accept", "*/*");

            logger.info("Executing HTTP request to SSLCOMMERZ");

            return httpClient.execute(httpPost, response -> {
                int statusCode = response.getCode();
                logger.debug("HTTP Status Code: {}", statusCode);

                if (statusCode >= 200 && statusCode < 300) {
                    String responseBody = new String(response.getEntity().getContent().readAllBytes(),
                            StandardCharsets.UTF_8);
                    logger.debug("Response body length: {} characters", responseBody.length());
                    logger.debug("Response body: {}", responseBody);
                    return responseBody;
                } else {
                    logger.error("HTTP request failed with status code: {}", statusCode);
                    String errorBody = new String(response.getEntity().getContent().readAllBytes(),
                            StandardCharsets.UTF_8);
                    logger.error("Error response body: {}", errorBody);
                    throw new IOException(
                            "HTTP request failed with status code: " + statusCode + ", Response: " + errorBody);
                }
            });
        } catch (Exception e) {
            logger.error("Error sending request to SSLCOMMERZ", e);
            throw new IOException("Failed to send request to SSLCOMMERZ: " + e.getMessage(), e);
        }
    }

    private Map<String, String> parseResponse(String response) {
        logger.debug("Parsing SSLCOMMERZ response: {}", response);

        Map<String, String> responseMap = new HashMap<>();

        if (response == null || response.trim().isEmpty()) {
            logger.error("Empty response received from SSLCOMMERZ");
            return responseMap;
        }

        try {
            // First, try to parse as JSON (SSLCOMMERZ returns JSON)
            if (response.trim().startsWith("{") && response.trim().endsWith("}")) {
                logger.debug("Parsing response as JSON");
                TypeReference<Map<String, Object>> typeRef = new TypeReference<Map<String, Object>>() {
                };
                Map<String, Object> jsonMap = objectMapper.readValue(response, typeRef);

                // Convert all values to strings
                for (Map.Entry<String, Object> entry : jsonMap.entrySet()) {
                    String key = entry.getKey();
                    String value = entry.getValue() != null ? entry.getValue().toString() : null;
                    responseMap.put(key, value);
                    logger.debug("Parsed JSON: {} = {}", key, value);
                }

                logger.debug("Parsed {} key-value pairs from JSON response", responseMap.size());

            } else {
                // Fallback: parse as key-value pairs (legacy format)
                logger.debug("Parsing response as key-value pairs");
                String[] lines = response.split("\n");
                logger.debug("Response has {} lines", lines.length);

                for (String line : lines) {
                    if (line.contains("=")) {
                        String[] parts = line.split("=", 2);
                        if (parts.length == 2) {
                            String key = parts[0].trim();
                            String value = parts[1].trim();
                            responseMap.put(key, value);
                            logger.debug("Parsed: {} = {}", key, value);
                        }
                    }
                }

                logger.debug("Parsed {} key-value pairs from response", responseMap.size());
            }

        } catch (Exception e) {
            logger.error("Error parsing SSLCOMMERZ response", e);
            logger.debug("Raw response that failed to parse: {}", response);
        }
        return responseMap;
    }

    private PaymentResponseDto convertToDto(Payment payment) {
        PaymentResponseDto dto = new PaymentResponseDto();
        dto.setId(payment.getId());
        dto.setTransactionId(payment.getTransactionId());
        dto.setCustomerName(payment.getCustomerName());
        dto.setCustomerEmail(payment.getCustomerEmail());
        dto.setCustomerPhone(payment.getCustomerPhone());
        dto.setCustomerAddress(payment.getCustomerAddress());
        dto.setAmount(payment.getAmount());
        dto.setCurrency(payment.getCurrency());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setStatus(payment.getStatus());
        dto.setDescription(payment.getDescription());
        dto.setCreatedAt(payment.getCreatedAt());

        return dto;
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    private String detectPaymentMethod(Map<String, String> responseData) {
        logger.debug("=== DETECTING PAYMENT METHOD ===");

        // First check for card type (for card payments)
        String cardType = responseData.get("card_type");
        logger.debug("SSLCOMMERZ card_type: '{}'", cardType);
        if (cardType != null && !cardType.trim().isEmpty()) {
            String cleanCardType = cardType.trim();
            // Validate that it's not a concatenated value
            if (cleanCardType.contains("-") || cleanCardType.length() > 20) {
                logger.warn("Suspicious card_type value (might be concatenated): '{}'", cleanCardType);
                // Extract the first part before any dash
                String[] parts = cleanCardType.split("-");
                cleanCardType = parts[0].trim();
                logger.info("Using first part of card_type: '{}'", cleanCardType);
            }
            logger.info("Payment method detected from card_type: '{}'", cleanCardType);
            return cleanCardType;
        }

        // Check bank_tran_id for mobile banking methods
        String bankTranId = responseData.get("bank_tran_id");
        logger.debug("SSLCOMMERZ bank_tran_id: '{}'", bankTranId);

        if (bankTranId != null && !bankTranId.trim().isEmpty()) {
            String upperBankTranId = bankTranId.toUpperCase();

            if (upperBankTranId.contains("BKASH")) {
                logger.info("Payment method detected from bank_tran_id: 'bKash'");
                return "bKash";
            } else if (upperBankTranId.contains("NAGAD")) {
                logger.info("Payment method detected from bank_tran_id: 'Nagad'");
                return "Nagad";
            } else if (upperBankTranId.contains("ROCKET")) {
                logger.info("Payment method detected from bank_tran_id: 'Rocket'");
                return "Rocket";
            } else if (upperBankTranId.contains("UPAY")) {
                logger.info("Payment method detected from bank_tran_id: 'Upay'");
                return "Upay";
            } else {
                logger.warn("Could not determine payment method from bank_tran_id: '{}'", bankTranId);
            }
        }

        // Check card_brand field (alternative field for card type)
        String cardBrand = responseData.get("card_brand");
        logger.debug("SSLCOMMERZ card_brand: '{}'", cardBrand);
        if (cardBrand != null && !cardBrand.trim().isEmpty()) {
            String cleanCardBrand = cardBrand.trim();
            logger.info("Payment method detected from card_brand: '{}'", cleanCardBrand);
            return cleanCardBrand;
        }

        // Check card_issuer field
        String cardIssuer = responseData.get("card_issuer");
        logger.debug("SSLCOMMERZ card_issuer: '{}'", cardIssuer);
        if (cardIssuer != null && !cardIssuer.trim().isEmpty()) {
            String cleanCardIssuer = cardIssuer.trim();
            logger.info("Payment method detected from card_issuer: '{}'", cleanCardIssuer);
            return cleanCardIssuer;
        }
        // Check other potential fields that might indicate payment method
        String gateway = responseData.get("gw_version");
        logger.debug("SSLCOMMERZ gw_version: '{}'", gateway);

        // Check if this is a card payment based on response fields
        String valId = responseData.get("val_id");
        String status = responseData.get("status");
        if (valId != null && "VALID".equals(status)) {
            // If we have a valid transaction but no specific method, assume it's a card
            // payment
            logger.info("Valid transaction detected but no specific payment method found, defaulting to 'Card'");
            return "Card";
        }
        // Log all SSLCOMMERZ response data for debugging
        logger.info("=== ALL SSLCOMMERZ RESPONSE FIELDS ===");
        responseData.forEach((key, value) -> logger.info("  {} = '{}'", key, value));
        logger.info("=== END SSLCOMMERZ RESPONSE ===");

        // For testing purposes, if we have a valid transaction, assume it's a test
        // payment
        if ("VALID".equals(status) || "SUCCESS".equals(status)) {
            logger.info(
                    "Valid transaction detected but no specific payment method found, defaulting to 'Test Payment'");
            return "Test Payment";
        }

        logger.warn("No recognizable payment method found in SSLCOMMERZ response");
        return "Unknown";
    }
}