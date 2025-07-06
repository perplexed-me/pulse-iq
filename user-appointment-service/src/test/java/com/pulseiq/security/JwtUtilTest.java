package com.pulseiq.security;

import java.util.Arrays;
import java.util.Date;

import javax.crypto.SecretKey;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@ExtendWith(MockitoExtension.class)
class JwtUtilTest {

    private JwtUtil jwtUtil;
    private UserDetails userDetails;
    private SecretKey secretKey;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();

        // Set test values using reflection
        ReflectionTestUtils.setField(jwtUtil, "SECRET", "mySecretKeyForTestingPurposesShouldBeAtLeast256Bits");
        ReflectionTestUtils.setField(jwtUtil, "EXPIRATION_MS", 86400000L); // 24 hours

        // Initialize the secret key
        jwtUtil.init();

        // Get the secret key for verification
        secretKey = Keys.hmacShaKeyFor("mySecretKeyForTestingPurposesShouldBeAtLeast256Bits".getBytes());

        // Setup mock UserDetails
        userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("test@example.com")
                .password("encoded_password")
                .authorities(Arrays.asList(new SimpleGrantedAuthority("ROLE_PATIENT")))
                .build();
    }

    @Test
    void generateToken_Success() {
        // Act
        String token = jwtUtil.generateToken(userDetails);

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.contains(".")); // JWT format has dots

        // Verify the token can be parsed
        String extractedUsername = jwtUtil.extractUsername(token);
        assertEquals("test@example.com", extractedUsername);
    }

    @Test
    void extractUsername_ValidToken_ReturnsUsername() {
        // Arrange
        String token = jwtUtil.generateToken(userDetails);

        // Act
        String username = jwtUtil.extractUsername(token);

        // Assert
        assertEquals("test@example.com", username);
    }

    @Test
    void extractUsername_InvalidToken_ThrowsException() {
        // Arrange
        String invalidToken = "invalid.jwt.token";

        // Act & Assert
        assertThrows(Exception.class, () -> jwtUtil.extractUsername(invalidToken));
    }

    @Test
    void validateToken_ValidTokenAndUser_ReturnsTrue() {
        // Arrange
        String token = jwtUtil.generateToken(userDetails);

        // Act
        boolean isValid = jwtUtil.validateToken(token, userDetails);

        // Assert
        assertTrue(isValid);
    }

    @Test
    void validateToken_ValidTokenDifferentUser_ReturnsFalse() {
        // Arrange
        String token = jwtUtil.generateToken(userDetails);

        UserDetails differentUser = org.springframework.security.core.userdetails.User.builder()
                .username("different@example.com")
                .password("encoded_password")
                .authorities(Arrays.asList(new SimpleGrantedAuthority("ROLE_PATIENT")))
                .build();

        // Act
        boolean isValid = jwtUtil.validateToken(token, differentUser);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_ExpiredToken_ReturnsFalse() {
        // Arrange - Create an expired token manually
        String expiredToken = Jwts.builder()
                .setSubject("test@example.com")
                .claim("role", userDetails.getAuthorities())
                .setIssuedAt(new Date(System.currentTimeMillis() - 172800000)) // 2 days ago
                .setExpiration(new Date(System.currentTimeMillis() - 86400000)) // 1 day ago (expired)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();

        // Act
        boolean isValid = jwtUtil.validateToken(expiredToken, userDetails);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_MalformedToken_ReturnsFalse() {
        // Arrange
        String malformedToken = "this.is.not.a.valid.jwt";

        // Act
        boolean result = jwtUtil.validateToken(malformedToken, userDetails);

        // Assert
        assertFalse(result);
    }

    @Test
    void tokenContainsCorrectClaims() {
        // Arrange
        String token = jwtUtil.generateToken(userDetails);

        // Act - Parse token manually to check claims
        var claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        // Assert
        assertEquals("test@example.com", claims.getSubject());
        assertNotNull(claims.get("role"));
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());

        // Check that expiration is in the future
        assertTrue(claims.getExpiration().after(new Date()));
    }

    @Test
    void tokenExpirationTimeIsCorrect() {
        // Arrange
        long beforeGeneration = System.currentTimeMillis();
        String token = jwtUtil.generateToken(userDetails);
        long afterGeneration = System.currentTimeMillis();

        // Act
        var claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        long expirationTime = claims.getExpiration().getTime();
        long issuedTime = claims.getIssuedAt().getTime();

        // Assert
        // Check that issued time is within our generation window
        assertTrue(issuedTime >= beforeGeneration - 1000); // Allow 1s tolerance for processing
        assertTrue(issuedTime <= afterGeneration + 1000);

        // Check that expiration is approximately 24 hours after issued time
        long expectedExpiration = issuedTime + 86400000L; // 24 hours
        long tolerance = 5000L; // 5 second tolerance
        assertTrue(Math.abs(expirationTime - expectedExpiration) < tolerance,
                String.format("Expected expiration %d, but was %d. Difference: %d ms",
                        expectedExpiration, expirationTime, Math.abs(expirationTime - expectedExpiration)) + " ms");
    }
}
