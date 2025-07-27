#!/bin/bash
# Comprehensive Payment Service Fix Script
# Run this on your Azure VM to fix all payment-related issues

echo "=== Payment Service Complete Fix ==="

# Function to wait for service
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        echo "⏳ Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 5
        attempt=$((attempt + 1))
    done
    echo "❌ $service_name failed to start within expected time"
    return 1
}

# 1. Fix Payment Schema and Table
echo "1. Creating payment schema and table..."
docker exec pulseiq_postgres psql -U pulseiq_user -d pulseiq_db -c "
-- Ensure payment schema exists
CREATE SCHEMA IF NOT EXISTS payment;

-- Create the payments table with exact structure
CREATE TABLE IF NOT EXISTS payment.payments (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(255) NOT NULL,
    customer_address VARCHAR(255) NOT NULL,
    amount DECIMAL(38,2) NOT NULL,
    currency VARCHAR(255) NOT NULL,
    payment_method VARCHAR(255) NOT NULL,
    status VARCHAR(255) CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED')),
    description TEXT,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Grant explicit permissions
GRANT ALL PRIVILEGES ON SCHEMA payment TO pulseiq_user;
GRANT ALL PRIVILEGES ON TABLE payment.payments TO pulseiq_user;
GRANT USAGE, SELECT ON SEQUENCE payment.payments_id_seq TO pulseiq_user;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payment.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payment.payments(created_at);

SELECT 'Payment schema and table created successfully!' AS result;
"

# 2. Stop and remove existing payment service
echo "2. Stopping existing payment service..."
docker stop pulseiq_payment_service 2>/dev/null || true
docker rm pulseiq_payment_service 2>/dev/null || true

# 3. Get environment variables from .env.azure
cd ~/pulseiq-app
if [ -f .env.azure ]; then
    echo "3. Loading environment variables..."
    set -a && source .env.azure && set +a
else
    echo "❌ .env.azure file not found! Creating basic one..."
    echo "PUBLIC_IP=$(curl -s ifconfig.me)" > .env.azure
    echo "DOCKER_USERNAME=your-docker-username" >> .env.azure
    echo "Please update .env.azure with proper values and run this script again!"
    exit 1
fi

# 4. Start payment service with correct configuration
echo "4. Starting payment service with correct configuration..."
docker run -d \
  --name pulseiq_payment_service \
  --network pulseiq-network \
  --restart unless-stopped \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://pulseiq_postgres:5432/pulseiq_db?currentSchema=payment \
  -e SPRING_DATASOURCE_USERNAME=pulseiq_user \
  -e SPRING_DATASOURCE_PASSWORD="${DB_PASSWORD}" \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e FRONTEND_ORIGIN="http://${PUBLIC_IP}:8080" \
  -e PUBLIC_IP="${PUBLIC_IP}" \
  -e SPRING_JPA_HIBERNATE_DDL_AUTO=update \
  -e SPRING_JPA_PROPERTIES_HIBERNATE_DEFAULT_SCHEMA=payment \
  -e MAIL_USERNAME="${MAIL_USERNAME}" \
  -e MAIL_PASSWORD="${MAIL_PASSWORD}" \
  -e SSLCOMMERZ_STORE_ID="${SSLCOMMERZ_STORE_ID}" \
  -e SSLCOMMERZ_STORE_PASSWORD="${SSLCOMMERZ_STORE_PASSWORD}" \
  -p 8082:8082 \
  ${DOCKER_USERNAME}/pulseiq-payment-service:latest

# 5. Wait for payment service to be ready
echo "5. Waiting for payment service to start..."
sleep 15

# Check if payment service is responding
wait_for_service "Payment Service" "http://localhost:8082/payment/"

# 6. Test payment service
echo "6. Testing payment service connectivity..."
curl -I http://localhost:8082/payment/ 2>/dev/null || echo "Payment service not responding yet"

# 7. Check logs for any errors
echo "7. Checking payment service logs..."
docker logs pulseiq_payment_service --tail 10

# 8. Final status
echo ""
echo "=== Final Status ==="
docker ps | grep pulseiq_payment_service

echo ""
echo "=== Environment Check ==="
echo "Public IP: $PUBLIC_IP"
echo "Payment Service URL: http://$PUBLIC_IP:8082"
echo "Frontend URL: http://$PUBLIC_IP:8080"

echo ""
echo "=== Test Commands ==="
echo "Test payment service health:"
echo "curl http://$PUBLIC_IP:8082/payment/"
echo ""
echo "Check payment service logs:"
echo "docker logs pulseiq_payment_service"
echo ""
echo "✅ Payment service fix completed!"
