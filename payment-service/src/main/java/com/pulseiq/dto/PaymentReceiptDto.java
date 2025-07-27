package com.pulseiq.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentReceiptDto {
    private String transactionId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String customerAddress;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String status;
    private String paymentMethod;
    private String storeId;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime transactionTime;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}