#!/bin/bash

echo "=== FIX MEDICINE TABLE CONSTRAINT ==="
echo "This script will fix the missing unique constraint and insert medicine data"
echo ""

# Check if database container is running
POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep postgres | head -1)
if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL container not found!"
    exit 1
fi

echo "✅ PostgreSQL container: $POSTGRES_CONTAINER"
echo ""

echo "=== 1. Check current table structure ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
\d pulseiq.medicine
"

echo ""
echo "=== 2. Check existing constraints ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'pulseiq.medicine'::regclass;
"

echo ""
echo "=== 3. Add missing unique constraint ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
ALTER TABLE pulseiq.medicine 
ADD CONSTRAINT uk_medicine_name_power 
UNIQUE (medicine_name, medicine_power);
"

echo ""
echo "=== 4. Verify constraint was added ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'pulseiq.medicine'::regclass
AND contype = 'u';
"

echo ""
echo "=== 5. Now insert medicine data with working ON CONFLICT ==="

# Create SQL file with medicine inserts using UPSERT
cat > /tmp/fix_medicine_insert.sql << 'EOF'
-- Set search path
SET search_path TO pulseiq, public;

-- Insert medicine data with working UPSERT
INSERT INTO pulseiq.medicine (medicine_name, medicine_power, medicine_image, description, category, manufacturer, price, is_active) VALUES
-- Basic Pain Relief & Fever
('Paracetamol', '500mg', '/images/medicines/paracetamol.jpg', 'Pain reliever and fever reducer', 'Pain Relief', 'GSK', 8.50, true),
('Ibuprofen', '400mg', '/images/medicines/ibuprofen.jpg', 'Anti-inflammatory pain reliever', 'Pain Relief', 'Johnson & Johnson', 12.00, true),
('Aspirin', '300mg', '/images/medicines/aspirin.jpg', 'Pain reliever and blood thinner', 'Pain Relief', 'Bayer', 10.00, true),

-- Common Antibiotics
('Amoxicillin', '500mg', '/images/medicines/amoxicillin.jpg', 'Antibiotic used to treat bacterial infections', 'Antibiotic', 'Pfizer', 15.50, true),
('Azithromycin', '250mg', '/images/medicines/azithromycin.jpg', 'Antibiotic used to treat various bacterial infections', 'Antibiotic', 'Novartis', 25.00, true),
('Ciprofloxacin', '500mg', '/images/medicines/ciprofloxacin.jpg', 'Antibiotic for bacterial infections', 'Antibiotic', 'Cipro', 20.00, true),

-- Essential Vitamins
('Vitamin D3', '1000 IU', '/images/medicines/vitamin-d3.jpg', 'Vitamin D supplement for bone health', 'Vitamin', 'Nature Made', 20.00, true),
('Vitamin C', '1000mg', '/images/medicines/vitamin-c.jpg', 'Vitamin C for immune support', 'Vitamin', 'Emergen-C', 18.00, true),
('Multivitamin', '1 tablet', '/images/medicines/multivitamin.jpg', 'Daily multivitamin supplement', 'Vitamin', 'Centrum', 35.00, true),
('Vitamin B12', '1000mcg', '/images/medicines/vitamin-b12.jpg', 'Vitamin B12 for energy and nerve health', 'Vitamin', 'Nature Made', 25.00, true),

-- Stomach/Digestive
('Omeprazole', '20mg', '/images/medicines/omeprazole.jpg', 'Proton pump inhibitor for acid reflux', 'Gastric', 'Prilosec', 30.00, true),
('Simethicone', '80mg', '/images/medicines/simethicone.jpg', 'Anti-gas medication', 'Gastric', 'Gas-X', 12.00, true),
('Ranitidine', '150mg', '/images/medicines/ranitidine.jpg', 'H2 blocker for acid reduction', 'Gastric', 'Zantac', 15.00, true),

-- Allergy
('Loratadine', '10mg', '/images/medicines/loratadine.jpg', 'Antihistamine for allergies', 'Allergy', 'Claritin', 22.00, true),
('Cetirizine', '10mg', '/images/medicines/cetirizine.jpg', 'Antihistamine for allergies', 'Allergy', 'Zyrtec', 24.00, true),
('Diphenhydramine', '25mg', '/images/medicines/diphenhydramine.jpg', 'Antihistamine for allergies and sleep', 'Allergy', 'Benadryl', 18.00, true),

-- Cold & Cough
('Dextromethorphan', '15mg', '/images/medicines/dextromethorphan.jpg', 'Cough suppressant', 'Cold & Cough', 'Robitussin', 16.00, true),
('Guaifenesin', '400mg', '/images/medicines/guaifenesin.jpg', 'Expectorant for chest congestion', 'Cold & Cough', 'Mucinex', 20.00, true),

-- Diabetes
('Metformin', '500mg', '/images/medicines/metformin.jpg', 'Type 2 diabetes medication', 'Diabetes', 'Glucophage', 45.00, true),
('Insulin', '100 units/ml', '/images/medicines/insulin.jpg', 'Insulin for diabetes management', 'Diabetes', 'Novolog', 80.00, true),

-- Heart & Blood Pressure
('Lisinopril', '10mg', '/images/medicines/lisinopril.jpg', 'ACE inhibitor for blood pressure', 'Cardiovascular', 'Prinivil', 35.00, true),
('Amlodipine', '5mg', '/images/medicines/amlodipine.jpg', 'Calcium channel blocker for blood pressure', 'Cardiovascular', 'Norvasc', 40.00, true)

ON CONFLICT (medicine_name, medicine_power) DO UPDATE SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    manufacturer = EXCLUDED.manufacturer,
    price = EXCLUDED.price,
    medicine_image = EXCLUDED.medicine_image,
    is_active = EXCLUDED.is_active;

-- Log the result
SELECT 'Medicine data insertion completed successfully!' as status;
SELECT COUNT(*) as total_medicines FROM pulseiq.medicine;
SELECT category, COUNT(*) as count FROM pulseiq.medicine WHERE is_active = true GROUP BY category ORDER BY category;
EOF

# Copy and execute the SQL file
docker cp /tmp/fix_medicine_insert.sql "$POSTGRES_CONTAINER":/tmp/fix_medicine_insert.sql
echo "Executing fixed medicine insert script..."
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -f /tmp/fix_medicine_insert.sql

echo ""
echo "=== 6. Final verification ==="
FINAL_COUNT=$(docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -t -c "SELECT COUNT(*) FROM pulseiq.medicine;" | tr -d ' ')
echo "Final medicine count: $FINAL_COUNT"

echo ""
echo "=== 7. List inserted medicines ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
SELECT 
    medicine_id,
    medicine_name,
    medicine_power,
    category,
    price
FROM pulseiq.medicine 
WHERE is_active = true 
ORDER BY category, medicine_name;
"

# Clean up
rm -f /tmp/fix_medicine_insert.sql

echo ""
echo "=== FIX COMPLETE ==="
if [ "$FINAL_COUNT" -gt 0 ]; then
    echo "✅ SUCCESS: $FINAL_COUNT medicines inserted!"
    echo "✅ Doctors can now select medicines for prescriptions"
else
    echo "❌ FAILED: No medicines were inserted"
fi
