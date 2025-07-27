#!/bin/bash
# Comprehensive fix script for PulseIQ deployment issues
# Run this on your Azure VM to fix all known issues

echo "=== PulseIQ Complete Fix Script ==="

# Function to check if container exists
container_exists() {
    docker ps -a --format "table {{.Names}}" | grep -q "^$1$"
}

# 1. Fix Payment Schema and Table
echo "1. Fixing Payment Schema and Table..."
docker exec pulseiq_postgres psql -U pulseiq_user -d pulseiq_db -c "
-- Ensure payment schema exists
CREATE SCHEMA IF NOT EXISTS payment;

-- Create the payments table with correct structure
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

SELECT 'Payment schema and table fixed!' AS result;
"

# 2. Fix PulseIQ Schema Permissions
echo "2. Fixing PulseIQ Schema Permissions..."
docker exec pulseiq_postgres psql -U pulseiq_user -d pulseiq_db -c "
-- Ensure pulseiq schema permissions
GRANT ALL PRIVILEGES ON SCHEMA pulseiq TO pulseiq_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pulseiq TO pulseiq_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA pulseiq TO pulseiq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA pulseiq GRANT ALL ON TABLES TO pulseiq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA pulseiq GRANT ALL ON SEQUENCES TO pulseiq_user;

SELECT 'PulseIQ schema permissions fixed!' AS result;
"

# 3. Check and create basic medicine entries if none exist
echo "3. Ensuring basic medicine data exists..."
docker exec pulseiq_postgres psql -U pulseiq_user -d pulseiq_db -c "
-- Check if medicine table exists and has data
DO \$\$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='pulseiq' AND table_name='medicine') THEN
        IF NOT EXISTS (SELECT 1 FROM pulseiq.medicine LIMIT 1) THEN
            -- Insert some basic medicines if table is empty
            INSERT INTO pulseiq.medicine (medicine_name, medicine_power, category, manufacturer, is_active, description) VALUES
            ('Paracetamol', '500mg', 'Painkiller', 'Generic', true, 'Common painkiller and fever reducer'),
            ('Ibuprofen', '400mg', 'Anti-inflammatory', 'Generic', true, 'Anti-inflammatory and painkiller'),
            ('Aspirin', '325mg', 'Painkiller', 'Generic', true, 'Pain relief and blood thinner'),
            ('Amoxicillin', '250mg', 'Antibiotic', 'Generic', true, 'Common antibiotic'),
            ('Vitamin D', '1000 IU', 'Vitamin', 'Generic', true, 'Vitamin D supplement')
            ON CONFLICT DO NOTHING;
            RAISE NOTICE 'Basic medicines inserted!';
        ELSE
            RAISE NOTICE 'Medicine table already has data, skipping insert.';
        END IF;
    ELSE
        RAISE NOTICE 'Medicine table does not exist yet, will be created by application.';
    END IF;
END
\$\$;
"

# 4. Restart services with proper order and wait times
echo "4. Restarting services in proper order..."

# Restart payment service first
if container_exists "pulseiq_payment_service"; then
    echo "Restarting payment service..."
    docker restart pulseiq_payment_service
    sleep 10
fi

# Restart user appointment service
if container_exists "pulseiq_user_appointment"; then
    echo "Restarting user appointment service..."
    docker restart pulseiq_user_appointment
    sleep 10
fi

# Restart AI service
if container_exists "pulseiq_ai_service"; then
    echo "Restarting AI service..."
    docker restart pulseiq_ai_service
    sleep 5
fi

# Restart frontend
if container_exists "pulseiq_frontend"; then
    echo "Restarting frontend..."
    docker restart pulseiq_frontend
    sleep 5
fi

# 5. Final status check
echo "5. Final Status Check..."
echo ""
echo "=== Container Status ==="
docker ps --filter network=pulseiq-network --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Service URLs ==="
PUBLIC_IP=\$(curl -s ifconfig.me || echo "localhost")
echo "🌐 Frontend: http://\${PUBLIC_IP}:8080"
echo "🏥 User Service: http://\${PUBLIC_IP}:8085"
echo "💳 Payment Service: http://\${PUBLIC_IP}:8082"
echo "🤖 AI Service: http://\${PUBLIC_IP}:8000"

echo ""
echo "=== Health Checks ==="
echo "Checking services..."
sleep 5

# Check if services are responding
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:8080/ || echo "Frontend: Not responding"
curl -s -o /dev/null -w "User Service: %{http_code}\n" http://localhost:8085/api/auth/health || echo "User Service: Not responding"
curl -s -o /dev/null -w "Payment Service: %{http_code}\n" http://localhost:8082/payment/ || echo "Payment Service: Not responding"
curl -s -o /dev/null -w "AI Service: %{http_code}\n" http://localhost:8000/ || echo "AI Service: Not responding"

echo ""
echo "✅ Fix script completed!"
echo "📝 If you still see issues, check the logs with:"
echo "   docker logs pulseiq_payment_service"
echo "   docker logs pulseiq_user_appointment"
