-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS pulseiq;

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
    -- Add indexes for better performance
    CONSTRAINT chk_medicine_name CHECK (medicine_name != ''),
    CONSTRAINT chk_medicine_power CHECK (medicine_power != ''),
    CONSTRAINT chk_category CHECK (category != '')
);

-- Create index on frequently queried fields
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

-- Insert sample medicines with proper conflict handling
INSERT INTO pulseiq.medicine (medicine_name, medicine_power, medicine_image, description, category, manufacturer, price, is_active) VALUES
-- Antibiotics
('Amoxicillin', '500mg', '/images/medicines/amoxicillin.jpg', 'Antibiotic used to treat bacterial infections', 'Antibiotic', 'Pfizer', 15.50, true),
('Azithromycin', '250mg', '/images/medicines/azithromycin.jpg', 'Antibiotic used to treat various bacterial infections', 'Antibiotic', 'Novartis', 25.00, true),
('Ciprofloxacin', '500mg', '/images/medicines/ciprofloxacin.jpg', 'Antibiotic used to treat bacterial infections', 'Antibiotic', 'Bayer', 18.75, true),
('Doxycycline', '100mg', '/images/medicines/doxycycline.jpg', 'Tetracycline antibiotic', 'Antibiotic', 'Pfizer', 42.00, true),
('Clarithromycin', '250mg', '/images/medicines/clarithromycin.jpg', 'Macrolide antibiotic', 'Antibiotic', 'Abbott', 55.00, true),
('Cephalexin', '500mg', '/images/medicines/cephalexin.jpg', 'Cephalosporin antibiotic', 'Antibiotic', 'Teva', 28.00, true),
('Clindamycin', '300mg', '/images/medicines/clindamycin.jpg', 'Lincosamide antibiotic', 'Antibiotic', 'Pfizer', 35.00, true),

-- Pain relievers
('Ibuprofen', '400mg', '/images/medicines/ibuprofen.jpg', 'Anti-inflammatory pain reliever', 'Pain Relief', 'Johnson & Johnson', 12.00, true),
('Paracetamol', '500mg', '/images/medicines/paracetamol.jpg', 'Pain reliever and fever reducer', 'Pain Relief', 'GSK', 8.50, true),
('Aspirin', '300mg', '/images/medicines/aspirin.jpg', 'Pain reliever and blood thinner', 'Pain Relief', 'Bayer', 10.00, true),
('Naproxen', '220mg', '/images/medicines/naproxen.jpg', 'Anti-inflammatory pain reliever', 'Pain Relief', 'Aleve', 16.00, true),
('Tramadol', '50mg', '/images/medicines/tramadol.jpg', 'Opioid pain medication', 'Pain Relief', 'Janssen', 65.00, true),
('Diclofenac', '50mg', '/images/medicines/diclofenac.jpg', 'NSAID pain reliever', 'Pain Relief', 'Novartis', 22.00, true),

-- Vitamins and Supplements
('Vitamin D3', '1000 IU', '/images/medicines/vitamin-d3.jpg', 'Vitamin D supplement for bone health', 'Vitamin', 'Nature Made', 20.00, true),
('Multivitamin', '1 tablet', '/images/medicines/multivitamin.jpg', 'Daily multivitamin supplement', 'Vitamin', 'Centrum', 35.00, true),
('Vitamin C', '1000mg', '/images/medicines/vitamin-c.jpg', 'Vitamin C for immune support', 'Vitamin', 'Emergen-C', 18.00, true),
('Vitamin B12', '1000mcg', '/images/medicines/vitamin-b12.jpg', 'Vitamin B12 supplement', 'Vitamin', 'Nature Made', 25.00, true),
('Folic Acid', '5mg', '/images/medicines/folic-acid.jpg', 'Folate supplement', 'Vitamin', 'GSK', 15.00, true),
('Iron', '65mg', '/images/medicines/iron.jpg', 'Iron supplement for anemia', 'Vitamin', 'Nature Made', 18.00, true),
('Calcium', '500mg', '/images/medicines/calcium.jpg', 'Calcium supplement for bone health', 'Vitamin', 'Citracal', 22.00, true),

-- Heart medications
('Lisinopril', '10mg', '/images/medicines/lisinopril.jpg', 'ACE inhibitor for blood pressure', 'Heart', 'Merck', 45.00, true),
('Metoprolol', '50mg', '/images/medicines/metoprolol.jpg', 'Beta blocker for heart conditions', 'Heart', 'AstraZeneca', 38.00, true),
('Atorvastatin', '20mg', '/images/medicines/atorvastatin.jpg', 'Statin for cholesterol', 'Heart', 'Pfizer', 52.00, true),
('Amlodipine', '5mg', '/images/medicines/amlodipine.jpg', 'Calcium channel blocker', 'Heart', 'Pfizer', 42.00, true),
('Warfarin', '5mg', '/images/medicines/warfarin.jpg', 'Anticoagulant blood thinner', 'Heart', 'Bristol Myers', 35.00, true),

-- Diabetes medications
('Metformin', '500mg', '/images/medicines/metformin.jpg', 'Type 2 diabetes medication', 'Diabetes', 'Teva', 28.00, true),
('Glipizide', '5mg', '/images/medicines/glipizide.jpg', 'Type 2 diabetes medication', 'Diabetes', 'Pfizer', 32.00, true),
('Insulin Glargine', '100 units/ml', '/images/medicines/insulin-glargine.jpg', 'Long-acting insulin', 'Diabetes', 'Sanofi', 125.00, true),
('Glyburide', '5mg', '/images/medicines/glyburide.jpg', 'Sulfonylurea for diabetes', 'Diabetes', 'Pfizer', 38.00, true),

-- Allergy medications
('Loratadine', '10mg', '/images/medicines/loratadine.jpg', 'Antihistamine for allergies', 'Allergy', 'Claritin', 22.00, true),
('Cetirizine', '10mg', '/images/medicines/cetirizine.jpg', 'Antihistamine for allergies', 'Allergy', 'Zyrtec', 24.00, true),
('Diphenhydramine', '25mg', '/images/medicines/diphenhydramine.jpg', 'Antihistamine and sleep aid', 'Allergy', 'Benadryl', 18.00, true),
('Fexofenadine', '180mg', '/images/medicines/fexofenadine.jpg', 'Non-drowsy antihistamine', 'Allergy', 'Allegra', 28.00, true),

-- Stomach medications
('Omeprazole', '20mg', '/images/medicines/omeprazole.jpg', 'Proton pump inhibitor for acid reflux', 'Gastric', 'Prilosec', 30.00, true),
('Ranitidine', '150mg', '/images/medicines/ranitidine.jpg', 'H2 blocker for heartburn', 'Gastric', 'Zantac', 26.00, true),
('Lansoprazole', '30mg', '/images/medicines/lansoprazole.jpg', 'Proton pump inhibitor', 'Gastric', 'Prevacid', 35.00, true),
('Simethicone', '80mg', '/images/medicines/simethicone.jpg', 'Anti-gas medication', 'Gastric', 'Gas-X', 12.00, true),
('Bismuth Subsalicylate', '262mg', '/images/medicines/bismuth.jpg', 'Stomach upset relief', 'Gastric', 'Pepto-Bismol', 15.00, true),

-- Respiratory medications
('Albuterol', '90mcg', '/images/medicines/albuterol.jpg', 'Bronchodilator for asthma', 'Respiratory', 'GSK', 65.00, true),
('Fluticasone', '50mcg', '/images/medicines/fluticasone.jpg', 'Nasal corticosteroid', 'Respiratory', 'GSK', 45.00, true),
('Montelukast', '10mg', '/images/medicines/montelukast.jpg', 'Leukotriene receptor antagonist', 'Respiratory', 'Merck', 85.00, true),
('Dextromethorphan', '15mg', '/images/medicines/dextromethorphan.jpg', 'Cough suppressant', 'Respiratory', 'Robitussin', 18.00, true),

-- Mental Health medications
('Sertraline', '50mg', '/images/medicines/sertraline.jpg', 'SSRI antidepressant', 'Mental Health', 'Pfizer', 75.00, true),
('Alprazolam', '0.5mg', '/images/medicines/alprazolam.jpg', 'Benzodiazepine for anxiety', 'Mental Health', 'Pfizer', 45.00, true),
('Fluoxetine', '20mg', '/images/medicines/fluoxetine.jpg', 'SSRI antidepressant', 'Mental Health', 'Eli Lilly', 68.00, true),
('Lorazepam', '1mg', '/images/medicines/lorazepam.jpg', 'Benzodiazepine for anxiety', 'Mental Health', 'Pfizer', 38.00, true),

-- Skin medications
('Hydrocortisone', '1%', '/images/medicines/hydrocortisone.jpg', 'Topical corticosteroid', 'Dermatology', 'Johnson & Johnson', 15.00, true),
('Clotrimazole', '1%', '/images/medicines/clotrimazole.jpg', 'Antifungal cream', 'Dermatology', 'Bayer', 22.00, true),
('Mupirocin', '2%', '/images/medicines/mupirocin.jpg', 'Topical antibiotic', 'Dermatology', 'GSK', 35.00, true),

-- Eye medications
('Artificial Tears', '0.5%', '/images/medicines/artificial-tears.jpg', 'Lubricating eye drops', 'Ophthalmology', 'Refresh', 18.00, true),
('Latanoprost', '0.005%', '/images/medicines/latanoprost.jpg', 'Glaucoma eye drops', 'Ophthalmology', 'Pfizer', 125.00, true),

-- Additional common medications
('Levothyroxine', '50mcg', '/images/medicines/levothyroxine.jpg', 'Thyroid hormone replacement', 'Endocrine', 'AbbVie', 48.00, true),
('Prednisone', '5mg', '/images/medicines/prednisone.jpg', 'Oral corticosteroid', 'Anti-inflammatory', 'Pfizer', 25.00, true),
('Gabapentin', '300mg', '/images/medicines/gabapentin.jpg', 'Anticonvulsant for nerve pain', 'Neurological', 'Pfizer', 55.00, true),
('Hydrochlorothiazide', '25mg', '/images/medicines/hydrochlorothiazide.jpg', 'Diuretic for blood pressure', 'Heart', 'Merck', 32.00, true)
ON CONFLICT (medicine_name, medicine_power) DO NOTHING;
