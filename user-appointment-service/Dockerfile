# ─────────────────────────────────────────────────────────────────────────────
# SUPER FAST Dockerfile - Just copy pre-built JAR (no Maven build in Docker)
# Build JAR locally or in CI before Docker build
# ─────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y curl --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy pre-built JAR file
COPY target/*.jar app.jar

# Create non-root user for security
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser && \
    chown appuser:appgroup /app/app.jar

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8085

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8085/actuator/health || exit 1

# Run the application with support for JAVA_OPTS environment variable
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
