-- PulseIQ Test Database Initialization Script
-- Minimal initialization for CI/CD testing

-- Create the pulseiq schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS pulseiq;

-- Grant necessary permissions to the test_user
GRANT ALL PRIVILEGES ON SCHEMA pulseiq TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pulseiq TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA pulseiq TO test_user;

-- Set default privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA pulseiq GRANT ALL ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA pulseiq GRANT ALL ON SEQUENCES TO test_user;
