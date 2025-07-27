-- Migration script to allow custom doctor names in test_results
-- This drops the foreign key constraint on doctor_id to allow custom doctor names

BEGIN;

-- Drop the foreign key constraint that prevents custom doctor names
ALTER TABLE IF EXISTS pulseiq.test_results
    DROP CONSTRAINT IF EXISTS fka6u40kbyoj59gay3vvuf57jtc;

-- Optional: Add a comment to document this change
COMMENT ON COLUMN pulseiq.test_results.doctor_id IS 'Doctor ID - can be a valid doctor ID from doctors table or a custom doctor name/text';

COMMIT;
