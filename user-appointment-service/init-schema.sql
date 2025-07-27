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

-- ===============================================
-- CREATE ESSENTIAL TABLES AND INITIAL DATA
-- ===============================================

-- Create Medicine table with proper unique constraint
CREATE TABLE IF NOT EXISTS pulseiq.medicine (
    medicine_id BIGSERIAL PRIMARY KEY,
    medicine_name VARCHAR(255) NOT NULL,
    medicine_power VARCHAR(50) NOT NULL,
    medicine_image VARCHAR(500),
    description VARCHAR(1000),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255),
    price DOUBLE PRECISION,
    -- Add unique constraint for proper conflict handling
    UNIQUE(medicine_name, medicine_power),
    -- Add constraints for data integrity
    CONSTRAINT chk_medicine_name CHECK (medicine_name != ''),
    CONSTRAINT chk_medicine_power CHECK (medicine_power != ''),
    CONSTRAINT chk_category CHECK (category != '')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medicine_category ON pulseiq.medicine(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medicine_name_search ON pulseiq.medicine(medicine_name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medicine_active ON pulseiq.medicine(is_active);

-- Create Prescription table
CREATE TABLE IF NOT EXISTS pulseiq.prescription (
    prescription_id BIGSERIAL PRIMARY KEY,
    doctor_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    appointment_id BIGINT NOT NULL,
    doctor_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create Prescription Medicine junction table
CREATE TABLE IF NOT EXISTS pulseiq.prescription_medicine (
    prescription_medicine_id BIGSERIAL PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    morning_dose BOOLEAN NOT NULL DEFAULT FALSE,
    noon_dose BOOLEAN NOT NULL DEFAULT FALSE,
    evening_dose BOOLEAN NOT NULL DEFAULT FALSE,
    meal_timing VARCHAR(20) NOT NULL CHECK (meal_timing IN ('BEFORE_MEAL', 'AFTER_MEAL', 'WITH_MEAL', 'EMPTY_STOMACH')),
    special_instructions VARCHAR(500),
    FOREIGN KEY (prescription_id) REFERENCES pulseiq.prescription(prescription_id),
    FOREIGN KEY (medicine_id) REFERENCES pulseiq.medicine(medicine_id)
);

-- Insert essential medicine data with conflict handling
INSERT INTO pulseiq.medicine (medicine_name, medicine_power, medicine_image, description, category, manufacturer, price, is_active) VALUES
-- Basic Pain Relief & Fever
('Paracetamol', '500mg', '/images/medicines/paracetamol.jpg', 'Pain reliever and fever reducer', 'Pain Relief', 'GSK', 8.50, true),
('Ibuprofen', '400mg', '/images/medicines/ibuprofen.jpg', 'Anti-inflammatory pain reliever', 'Pain Relief', 'Johnson & Johnson', 12.00, true),
('Aspirin', '300mg', '/images/medicines/aspirin.jpg', 'Pain reliever and blood thinner', 'Pain Relief', 'Bayer', 10.00, true),

-- Common Antibiotics
('Amoxicillin', '500mg', '/images/medicines/amoxicillin.jpg', 'Antibiotic used to treat bacterial infections', 'Antibiotic', 'Pfizer', 15.50, true),
('Azithromycin', '250mg', '/images/medicines/azithromycin.jpg', 'Antibiotic used to treat various bacterial infections', 'Antibiotic', 'Novartis', 25.00, true),

-- Essential Vitamins
('Vitamin D3', '1000 IU', '/images/medicines/vitamin-d3.jpg', 'Vitamin D supplement for bone health', 'Vitamin', 'Nature Made', 20.00, true),
('Vitamin C', '1000mg', '/images/medicines/vitamin-c.jpg', 'Vitamin C for immune support', 'Vitamin', 'Emergen-C', 18.00, true),
('Multivitamin', '1 tablet', '/images/medicines/multivitamin.jpg', 'Daily multivitamin supplement', 'Vitamin', 'Centrum', 35.00, true),

-- Stomach/Digestive
('Omeprazole', '20mg', '/images/medicines/omeprazole.jpg', 'Proton pump inhibitor for acid reflux', 'Gastric', 'Prilosec', 30.00, true),
('Simethicone', '80mg', '/images/medicines/simethicone.jpg', 'Anti-gas medication', 'Gastric', 'Gas-X', 12.00, true),

-- Allergy
('Loratadine', '10mg', '/images/medicines/loratadine.jpg', 'Antihistamine for allergies', 'Allergy', 'Claritin', 22.00, true),
('Cetirizine', '10mg', '/images/medicines/cetirizine.jpg', 'Antihistamine for allergies', 'Allergy', 'Zyrtec', 24.00, true)
ON CONFLICT (medicine_name, medicine_power) DO NOTHING;

-- Grant permissions on newly created tables
GRANT ALL PRIVILEGES ON TABLE pulseiq.medicine TO pulseiq_user;
GRANT ALL PRIVILEGES ON TABLE pulseiq.prescription TO pulseiq_user;
GRANT ALL PRIVILEGES ON TABLE pulseiq.prescription_medicine TO pulseiq_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pulseiq TO pulseiq_user;

-- Also grant to test_user if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_user') THEN
        GRANT ALL PRIVILEGES ON TABLE pulseiq.medicine TO test_user;
        GRANT ALL PRIVILEGES ON TABLE pulseiq.prescription TO test_user;
        GRANT ALL PRIVILEGES ON TABLE pulseiq.prescription_medicine TO test_user;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pulseiq TO test_user;
        RAISE NOTICE 'Table permissions granted to test_user';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error granting table permissions to test_user: %', SQLERRM;
END
$$;

-- Log successful completion
SELECT 'PulseIQ database initialization completed successfully - Essential medicine data loaded!' AS status;