-- PulseIQ Test Database Initialization Script
-- Minimal initialization for CI/CD testing

-- Create the pulseiq schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS pulseiq;

-- Create the payment schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS payment;

-- Grant necessary permissions to the test_user for pulseiq schema
GRANT ALL PRIVILEGES ON SCHEMA pulseiq TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pulseiq TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA pulseiq TO test_user;

-- Grant necessary permissions to the test_user for payment schema
GRANT ALL PRIVILEGES ON SCHEMA payment TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA payment TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA payment TO test_user;

-- Set default privileges for future tables and sequences in pulseiq schema
ALTER DEFAULT PRIVILEGES IN SCHEMA pulseiq GRANT ALL ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA pulseiq GRANT ALL ON SEQUENCES TO test_user;

-- Set default privileges for future tables and sequences in payment schema
ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT ALL ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT ALL ON SEQUENCES TO test_user;
