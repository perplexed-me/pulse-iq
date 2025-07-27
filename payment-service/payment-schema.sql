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
