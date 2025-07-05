-- PulseIQ Database Initialization Script
-- This script initializes the database schema and user permissions

-- Create the pulseiq schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS pulseiq;

-- Set the default search path for the current session
SET search_path TO pulseiq, public;

-- Grant necessary permissions to the pulseiq_user
GRANT USAGE ON SCHEMA pulseiq TO pulseiq_user;
GRANT CREATE ON SCHEMA pulseiq TO pulseiq_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pulseiq TO pulseiq_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA pulseiq TO pulseiq_user;

-- Set default privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA pulseiq GRANT ALL ON TABLES TO pulseiq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA pulseiq GRANT ALL ON SEQUENCES TO pulseiq_user;

-- Support for test user (used in CI/CD) - conditional execution
DO $$
BEGIN
    -- Check if test_user exists before granting permissions
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_user') THEN
        GRANT USAGE ON SCHEMA pulseiq TO test_user;
        GRANT CREATE ON SCHEMA pulseiq TO test_user;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pulseiq TO test_user;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA pulseiq TO test_user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA pulseiq GRANT ALL ON TABLES TO test_user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA pulseiq GRANT ALL ON SEQUENCES TO test_user;
        RAISE NOTICE 'Permissions granted to test_user';
    ELSE
        RAISE NOTICE 'test_user does not exist, skipping test permissions';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors for missing test_user (in production)
    RAISE NOTICE 'Error granting test_user permissions: %', SQLERRM;
END
$$;