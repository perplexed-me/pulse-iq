# SUPER FAST Dockerfile for CI/CD Production Builds
# This uses aggressive caching and minimal steps for fastest CI/CD

FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

# Install only what we need
RUN apt-get update && \
    apt-get install -y maven curl --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Copy pom.xml first for better Docker layer caching
COPY pom.xml ./

# Download dependencies with aggressive caching
RUN mvn dependency:resolve -B --quiet

# Copy source and build
COPY src ./src

# Build with minimal output and skip tests for speed
RUN mvn clean package -DskipTests -B --quiet

# Create user
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8085

# Run the app
CMD ["sh", "-c", "java -jar target/*.jar"]
