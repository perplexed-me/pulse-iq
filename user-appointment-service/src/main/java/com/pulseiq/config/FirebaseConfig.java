package com.pulseiq.config;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import jakarta.annotation.PostConstruct;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Autowired
    private Environment env;

    @PostConstruct
    public void init() throws IOException {
        // Debug logging for all Firebase-related environment variables
        logger.info("=== Firebase Configuration Debug ===");
        logger.info("firebase.enabled property: {}", env.getProperty("firebase.enabled"));
        logger.info("FIREBASE_ENABLED env var: {}", env.getProperty("FIREBASE_ENABLED"));
        logger.info("FIREBASE_JSON env var present: {}", env.getProperty("FIREBASE_JSON") != null);
        if (env.getProperty("FIREBASE_JSON") != null) {
            String firebaseJson = env.getProperty("FIREBASE_JSON");
            logger.info("FIREBASE_JSON length: {}", firebaseJson.length());
            logger.info("FIREBASE_JSON starts with: {}",
                    firebaseJson.substring(0, Math.min(50, firebaseJson.length())));
        }

        // Check if Firebase should be initialized
        // Try both firebase.enabled property and FIREBASE_ENABLED environment variable
        String firebaseEnabled = env.getProperty("firebase.enabled",
                env.getProperty("FIREBASE_ENABLED", "false"));
        logger.info("Final Firebase enabled value: {}", firebaseEnabled);
        if (!"true".equalsIgnoreCase(firebaseEnabled)) {
            logger.warn(
                    "🔥 Firebase initialization is DISABLED via configuration (firebase.enabled={}, FIREBASE_ENABLED={})",
                    env.getProperty("firebase.enabled"), env.getProperty("FIREBASE_ENABLED"));
            logger.warn("🔥 Google authentication will NOT work!");
            return;
        }

        try {
            GoogleCredentials credentials = null;

            // First, try to get Firebase config from environment variable
            String firebaseJson = env.getProperty("FIREBASE_JSON");
            if (firebaseJson != null && !firebaseJson.trim().isEmpty()) {
                logger.info("Loading Firebase configuration from environment variable");
                logger.debug("Firebase JSON length: {}", firebaseJson.length());
                logger.debug("Firebase JSON first 100 chars: {}",
                        firebaseJson.substring(0, Math.min(100, firebaseJson.length())));

                try (InputStream credentialStream = new ByteArrayInputStream(
                        firebaseJson.getBytes(StandardCharsets.UTF_8))) {
                    credentials = GoogleCredentials.fromStream(credentialStream);
                    logger.info("Firebase credentials loaded from environment variable");
                }
            } else {
                // Fallback to file-based configuration
                logger.info("Environment variable FIREBASE_JSON not found, trying file-based configuration");

                // First try to load from mounted file path (for Docker)
                java.io.File mountedFile = new java.io.File("/app/firebase-service-account.json");
                if (mountedFile.exists()) {
                    logger.info("Loading Firebase configuration from mounted file: /app/firebase-service-account.json");
                    try (InputStream serviceAccount = new java.io.FileInputStream(mountedFile)) {
                        String content = new String(serviceAccount.readAllBytes(), StandardCharsets.UTF_8);
                        if (content.contains("YOUR_ACTUAL_PRIVATE_KEY") || content.contains("your_private_key_id")) {
                            logger.warn(
                                    "Firebase service account file contains placeholder values. Skipping Firebase initialization.");
                            return;
                        }

                        // Reset the stream for actual use
                        try (InputStream serviceAccountReset = new java.io.FileInputStream(mountedFile)) {
                            credentials = GoogleCredentials.fromStream(serviceAccountReset);
                            logger.info("Firebase credentials loaded from mounted file");
                        }
                    }
                } else {
                    // Fallback to classpath resource
                    logger.info("Mounted file not found, trying classpath resource");
                    try (InputStream serviceAccount = getClass().getClassLoader()
                            .getResourceAsStream("firebase-service-account.json")) {
                        if (serviceAccount == null) {
                            logger.warn(
                                    "firebase-service-account.json not found in classpath either. Skipping Firebase initialization.");
                            return;
                        }

                        // Read the service account content to validate it
                        String content = new String(serviceAccount.readAllBytes(), StandardCharsets.UTF_8);
                        if (content.contains("YOUR_ACTUAL_PRIVATE_KEY") || content.contains("your_private_key_id")) {
                            logger.warn(
                                    "Firebase service account file contains placeholder values. Skipping Firebase initialization.");
                            return;
                        }

                        // Reset the stream for actual use
                        try (InputStream serviceAccountReset = getClass().getClassLoader()
                                .getResourceAsStream("firebase-service-account.json")) {
                            credentials = GoogleCredentials.fromStream(serviceAccountReset);
                            logger.info("Firebase credentials loaded from classpath resource");
                        }
                    }
                }
            }

            if (credentials != null) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();

                // Avoid re-initializing if the app is already initialized
                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                    logger.info("✅ Firebase initialized successfully");
                } else {
                    logger.info("✅ Firebase app already initialized");
                }
            } else {
                logger.error("❌ Failed to load Firebase credentials from any source");
                logger.error("❌ Google authentication will NOT work!");
            }

        } catch (Exception e) {
            logger.error(
                    "❌ Failed to initialize Firebase. The application will continue without Firebase functionality.",
                    e);
            logger.error("❌ Google authentication will NOT work!");
            // Don't throw the exception - let the application start without Firebase
        }
    }
}