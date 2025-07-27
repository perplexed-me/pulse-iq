-- Fix notification type constraint to include PRESCRIPTION_UPLOADED
-- This script updates the database constraint to allow the PRESCRIPTION_UPLOADED notification type

-- First, let's check what the current constraint looks like
-- DROP CONSTRAINT IF EXISTS notifications_type_check ON pulseiq.notifications;

-- Update the constraint to include PRESCRIPTION_UPLOADED
ALTER TABLE pulseiq.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with all notification types
ALTER TABLE pulseiq.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'TEST_RESULT_UPLOADED',
    'APPOINTMENT_BOOKED',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_REMINDER',
    'PRESCRIPTION_UPLOADED',
    'SYSTEM_NOTIFICATION',
    'GENERAL'
));

-- Also check if the table exists and if not, create it with the proper constraint
CREATE TABLE IF NOT EXISTS pulseiq.notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    recipient_id VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'TEST_RESULT_UPLOADED',
        'APPOINTMENT_BOOKED',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_REMINDER',
        'PRESCRIPTION_UPLOADED',
        'SYSTEM_NOTIFICATION',
        'GENERAL'
    )),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_entity_id VARCHAR(255),
    related_entity_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    created_by VARCHAR(255)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON pulseiq.notifications (recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON pulseiq.notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON pulseiq.notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON pulseiq.notifications (is_read);
