#!/bin/bash
# Quick fix script to create payments table in existing deployment
# Run this on your Azure VM to immediately fix the payment service

echo "=== Payment Table Quick Fix ==="

# Connect to the running PostgreSQL container and create the payments table
docker exec pulseiq_postgres psql -U pulseiq_user -d pulseiq_db -c "
-- Ensure payment schema exists
CREATE SCHEMA IF NOT EXISTS payment;

-- Create the payments table
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

-- Grant permissions to pulseiq_user
GRANT ALL PRIVILEGES ON TABLE payment.payments TO pulseiq_user;
GRANT USAGE, SELECT ON SEQUENCE payment.payments_id_seq TO pulseiq_user;

-- Create useful indexes
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payment.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payment.payments(created_at);

SELECT 'Payment table created successfully!' AS result;
"

if [ $? -eq 0 ]; then
    echo "✅ Payment table created successfully!"
    echo "🔄 Restarting payment service to pick up the changes..."
    
    # Restart the payment service
    docker restart pulseiq_payment_service
    
    echo "✅ Payment service restarted!"
    echo "🎉 Payment functionality should now work!"
else
    echo "❌ Failed to create payment table"
    exit 1
fi
