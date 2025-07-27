#!/bin/bash
# Quick diagnosis script for payment service issues

echo "=== Payment Service Diagnosis ==="

echo "1. Checking if payment service container is running..."
docker ps | grep pulseiq_payment_service

echo ""
echo "2. Checking payment service logs (last 20 lines)..."
docker logs pulseiq_payment_service --tail 20

echo ""
echo "3. Checking if payment service port is accessible..."
curl -I http://localhost:8082/payment/ 2>/dev/null || echo "Payment service not responding on port 8082"

echo ""
echo "4. Checking payment schema and table..."
docker exec pulseiq_postgres psql -U pulseiq_user -d pulseiq_db -c "
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'payment';
"

echo ""
echo "5. Checking payment service environment variables..."
docker exec pulseiq_payment_service printenv | grep -E "(SPRING_|DB_|PUBLIC_IP|MAIL_)" | sort

echo ""
echo "=== Quick Fixes ==="
echo "If payment service is not running, restart it:"
echo "docker restart pulseiq_payment_service"
echo ""
echo "If payment table is missing, create it:"
echo 'docker exec pulseiq_postgres psql -U pulseiq_user -d pulseiq_db -c "
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
    status VARCHAR(255) CHECK (status IN ('"'"'PENDING'"'"','"'"'PROCESSING'"'"','"'"'COMPLETED'"'"','"'"'FAILED'"'"','"'"'CANCELLED'"'"')),
    description TEXT,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);
GRANT ALL PRIVILEGES ON TABLE payment.payments TO pulseiq_user;
GRANT USAGE, SELECT ON SEQUENCE payment.payments_id_seq TO pulseiq_user;
"'
