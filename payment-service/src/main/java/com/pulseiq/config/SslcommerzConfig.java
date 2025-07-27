package com.pulseiq.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class SslcommerzConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(SslcommerzConfig.class);
    
    @Value("${sslcommerz.store.id}")
    private String storeId;
    
    @Value("${sslcommerz.store.password}")
    private String storePassword;
    
    @Value("${sslcommerz.api.url}")
    private String apiUrl;
    
    @Value("${sslcommerz.success.url}")
    private String successUrl;
    
    @Value("${sslcommerz.fail.url}")
    private String failUrl;
    
    @Value("${sslcommerz.cancel.url}")
    private String cancelUrl;
    
    @Value("${sslcommerz.ipn.url}")
    private String ipnUrl;
    
    @PostConstruct
    public void logConfiguration() {
        logger.info("SSLCOMMERZ Configuration loaded:");
        logger.info("Store ID: {}", storeId);
        logger.info("API URL: {}", apiUrl);
        logger.info("Success URL: {}", successUrl);
        logger.info("Fail URL: {}", failUrl);
        logger.info("Cancel URL: {}", cancelUrl);
        logger.info("IPN URL: {}", ipnUrl);
        logger.info("Store Password: {}", storePassword != null ? "***" : "NULL");
    }
    
    // Getters
    public String getStoreId() {
        return storeId;
    }
    
    public String getStorePassword() {
        return storePassword;
    }
    
    public String getApiUrl() {
        return apiUrl;
    }
    
    public String getSuccessUrl() {
        return successUrl;
    }
    
    public String getFailUrl() {
        return failUrl;
    }
    
    public String getCancelUrl() {
        return cancelUrl;
    }
    
    public String getIpnUrl() {
        return ipnUrl;
    }
} 