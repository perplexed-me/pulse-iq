-- Payment Service Database Schema Initialization
-- This script creates the payment schema for the payment service

-- Create the payment schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS payment;

-- Set the default search path to include payment schema
SET search_path TO payment, public;

-- Grant necessary permissions to the pulseiq_user
GRANT USAGE ON SCHEMA payment TO pulseiq_user;
GRANT CREATE ON SCHEMA payment TO pulseiq_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA payment TO pulseiq_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA payment TO pulseiq_user;

-- Set default privileges for future tables and sequences in payment schema
ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT ALL ON TABLES TO pulseiq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT ALL ON SEQUENCES TO pulseiq_user;

-- Support for test user (used in CI/CD) - conditional execution
DO $$
BEGIN
    -- Check if test_user exists before granting permissions
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_user') THEN
        GRANT USAGE ON SCHEMA payment TO test_user;
        GRANT CREATE ON SCHEMA payment TO test_user;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA payment TO test_user;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA payment TO test_user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT ALL ON TABLES TO test_user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT ALL ON SEQUENCES TO test_user;
        RAISE NOTICE 'Payment schema permissions granted to test_user';
    ELSE
        RAISE NOTICE 'test_user does not exist, skipping test permissions for payment schema';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors for missing test_user (in production)
    RAISE NOTICE 'Error granting test_user permissions for payment schema: %', SQLERRM;
END
$$;

-- Log successful completion
SELECT 'Payment schema initialization completed successfully' AS status;

-- Create the payments table if it doesn't exist
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

-- Grant explicit permissions on the payments table and sequence
GRANT ALL PRIVILEGES ON TABLE payment.payments TO pulseiq_user;
GRANT USAGE, SELECT ON SEQUENCE payment.payments_id_seq TO pulseiq_user;

-- Create index on transaction_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payment.payments(transaction_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment.payments(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payment.payments(created_at);

-- Log table creation completion
SELECT 'Payment tables created successfully' AS status;
