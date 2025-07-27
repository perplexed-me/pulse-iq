-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS pulseiq;

-- Create Medicine table
CREATE TABLE IF NOT EXISTS pulseiq.medicine (
    medicine_id BIGSERIAL PRIMARY KEY,
    medicine_name VARCHAR(255) NOT NULL,
    medicine_power VARCHAR(50) NOT NULL,
    medicine_image VARCHAR(500),
    description VARCHAR(1000),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255),
    price DOUBLE PRECISION
);

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

-- Insert sample medicines
INSERT INTO pulseiq.medicine (medicine_name, medicine_power, medicine_image, description, category, manufacturer, price, is_active) VALUES
-- Antibiotics
('Amoxicillin', '500mg', '/images/medicines/amoxicillin.jpg', 'Antibiotic used to treat bacterial infections', 'Antibiotic', 'Pfizer', 15.50, true),
('Azithromycin', '250mg', '/images/medicines/azithromycin.jpg', 'Antibiotic used to treat various bacterial infections', 'Antibiotic', 'Novartis', 25.00, true),
('Ciprofloxacin', '500mg', '/images/medicines/ciprofloxacin.jpg', 'Antibiotic used to treat bacterial infections', 'Antibiotic', 'Bayer', 18.75, true),

-- Pain relievers
('Ibuprofen', '400mg', '/images/medicines/ibuprofen.jpg', 'Anti-inflammatory pain reliever', 'Pain Relief', 'Johnson & Johnson', 12.00, true),
('Paracetamol', '500mg', '/images/medicines/paracetamol.jpg', 'Pain reliever and fever reducer', 'Pain Relief', 'GSK', 8.50, true),
('Aspirin', '300mg', '/images/medicines/aspirin.jpg', 'Pain reliever and blood thinner', 'Pain Relief', 'Bayer', 10.00, true),

-- Vitamins
('Vitamin D3', '1000 IU', '/images/medicines/vitamin-d3.jpg', 'Vitamin D supplement for bone health', 'Vitamin', 'Nature Made', 20.00, true),
('Multivitamin', '1 tablet', '/images/medicines/multivitamin.jpg', 'Daily multivitamin supplement', 'Vitamin', 'Centrum', 35.00, true),
('Vitamin C', '1000mg', '/images/medicines/vitamin-c.jpg', 'Vitamin C for immune support', 'Vitamin', 'Emergen-C', 18.00, true),

-- Heart medications
('Lisinopril', '10mg', '/images/medicines/lisinopril.jpg', 'ACE inhibitor for blood pressure', 'Heart', 'Merck', 45.00, true),
('Metoprolol', '50mg', '/images/medicines/metoprolol.jpg', 'Beta blocker for heart conditions', 'Heart', 'AstraZeneca', 38.00, true),

-- Diabetes medications
('Metformin', '500mg', '/images/medicines/metformin.jpg', 'Type 2 diabetes medication', 'Diabetes', 'Teva', 28.00, true),
('Glipizide', '5mg', '/images/medicines/glipizide.jpg', 'Type 2 diabetes medication', 'Diabetes', 'Pfizer', 32.00, true),

-- Allergy medications
('Loratadine', '10mg', '/images/medicines/loratadine.jpg', 'Antihistamine for allergies', 'Allergy', 'Claritin', 22.00, true),
('Cetirizine', '10mg', '/images/medicines/cetirizine.jpg', 'Antihistamine for allergies', 'Allergy', 'Zyrtec', 24.00, true),

-- Stomach medications
('Omeprazole', '20mg', '/images/medicines/omeprazole.jpg', 'Proton pump inhibitor for acid reflux', 'Gastric', 'Prilosec', 30.00, true),
('Ranitidine', '150mg', '/images/medicines/ranitidine.jpg', 'H2 blocker for heartburn', 'Gastric', 'Zantac', 26.00, true),

-- More antibiotics
('Doxycycline', '100mg', '/images/medicines/doxycycline.jpg', 'Tetracycline antibiotic', 'Antibiotic', 'Pfizer', 42.00, true),
('Clarithromycin', '250mg', '/images/medicines/clarithromycin.jpg', 'Macrolide antibiotic', 'Antibiotic', 'Abbott', 55.00, true),

-- Additional pain medications
('Naproxen', '220mg', '/images/medicines/naproxen.jpg', 'Anti-inflammatory pain reliever', 'Pain Relief', 'Aleve', 16.00, true),
('Tramadol', '50mg', '/images/medicines/tramadol.jpg', 'Opioid pain medication', 'Pain Relief', 'Janssen', 65.00, true)
ON CONFLICT (medicine_name, medicine_power) DO NOTHING;
