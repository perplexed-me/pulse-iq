package com.pulseiq.service;

import com.pulseiq.dto.PaymentRequestDto;
import com.pulseiq.dto.PaymentResponseDto;

import java.util.Map;

public interface SslcommerzService {

  PaymentResponseDto initiatePaymentDirectWithTransactionId(PaymentRequestDto paymentRequest, String transactionId);

  PaymentResponseDto validatePayment(Map<String, String> responseData);

  String generateTransactionId();

  boolean verifySignature(Map<String, String> responseData);
}