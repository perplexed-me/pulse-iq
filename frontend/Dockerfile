# syntax=docker/dockerfile:1
# Optimized Production Dockerfile for Azure Container Apps

# Build stage
FROM node:20-slim AS builder

# Install system dependencies in a single layer
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Verify package-lock.json exists and install dependencies
RUN if [ ! -f package-lock.json ]; then \
    echo "ERROR: package-lock.json not found in Docker context" && \
    echo "Files in current directory:" && \
    ls -la && \
    echo "Make sure you're running Docker build from the frontend directory with '.' as context" && \
    exit 1; \
    fi && \
    echo "Found package-lock.json, proceeding with npm ci..." && \
    # Try npm ci first, fall back to npm install if lock file is out of sync
    (npm ci --only=production=false --include=optional || \
    (echo "npm ci failed, trying npm install to fix dependency conflicts..." && \
    rm -f package-lock.json && \
    npm install)) && \
    npm install @rollup/rollup-linux-x64-gnu --save-dev --force || true && \
    npm install @esbuild/linux-x64 --save-dev --force || true

# Copy source code (this layer will be invalidated when source changes)
COPY . .

# Build arguments for environment configuration
# Note: Firebase configuration values are PUBLIC and intended for client-side use
# Docker Scout warnings about these being "secrets" are false positives
ARG VITE_USER_APPOINTMENT_API_URL
ARG VITE_PAYMENT_SERVICE_API_URL
ARG VITE_AI_SERVICE_API_URL
# Firebase public configuration (not secrets - safe for client-side)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID

# Set environment variables (these become part of the client-side build)
ENV NODE_ENV=production
ENV VITE_USER_APPOINTMENT_API_URL=$VITE_USER_APPOINTMENT_API_URL
ENV VITE_PAYMENT_SERVICE_API_URL=$VITE_PAYMENT_SERVICE_API_URL
ENV VITE_AI_SERVICE_API_URL=$VITE_AI_SERVICE_API_URL
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

# Build application with optimizations
ENV NODE_OPTIONS="--max_old_space_size=4096"
RUN npm run build:docker

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Set permissions
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nextjs:nodejs /var/run/nginx.pid

USER nextjs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
