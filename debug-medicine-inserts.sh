#!/bin/bash

echo "=== MEDICINE TABLE DEBUG SCRIPT ==="
echo "This script will check why medicine inserts are not working"
echo ""

# Check if database container is running
POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep postgres | head -1)
if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL container not found"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi

echo "✅ PostgreSQL container found: $POSTGRES_CONTAINER"
echo ""

echo "=== 1. Check if medicine table exists ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'pulseiq' AND tablename = 'medicine';
"

echo ""
echo "=== 2. Check current medicine table data ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
SELECT COUNT(*) as total_medicines, 
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_medicines
FROM pulseiq.medicine;
"

echo ""
echo "=== 3. Check existing medicine names ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
SELECT medicine_name, medicine_power, is_active 
FROM pulseiq.medicine 
ORDER BY medicine_name 
LIMIT 10;
"

echo ""
echo "=== 4. Check table structure ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
\d pulseiq.medicine
"

echo ""
echo "=== 5. Check unique constraint ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'pulseiq.medicine'::regclass;
"

echo ""
echo "=== 6. Test manual insert ==="
echo "Testing if we can manually insert a medicine..."
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
INSERT INTO pulseiq.medicine (medicine_name, medicine_power, medicine_image, description, category, manufacturer, price, is_active) 
VALUES ('Test Medicine', '100mg', '/test.jpg', 'Test description', 'Test Category', 'Test Manufacturer', 10.00, true)
ON CONFLICT (medicine_name, medicine_power) DO UPDATE SET 
    description = 'Updated: ' || EXCLUDED.description;
"

echo ""
echo "=== 7. Check if test medicine was inserted ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
SELECT * FROM pulseiq.medicine WHERE medicine_name = 'Test Medicine';
"

echo ""
echo "=== 8. Run the actual medicine inserts manually ==="
echo "Attempting to run the medicine insert statements..."

# Create a temporary SQL file with our medicine inserts
cat > /tmp/medicine_inserts.sql << 'EOF'
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
ON CONFLICT (medicine_name, medicine_power) DO UPDATE SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    manufacturer = EXCLUDED.manufacturer,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active;
EOF

# Copy and execute the SQL file
docker cp /tmp/medicine_inserts.sql "$POSTGRES_CONTAINER":/tmp/medicine_inserts.sql
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U postgres -d Billing -f /tmp/medicine_inserts.sql

echo ""
echo "=== 9. Final medicine count ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U postgres -d Billing -c "
SELECT COUNT(*) as total_medicines,
       COUNT(CASE WHEN category = 'Pain Relief' THEN 1 END) as pain_relief_medicines,
       COUNT(CASE WHEN category = 'Antibiotic' THEN 1 END) as antibiotic_medicines,
       COUNT(CASE WHEN category = 'Vitamin' THEN 1 END) as vitamin_medicines
FROM pulseiq.medicine;
"

echo ""
echo "=== 10. List all medicines ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U postgres -d Billing -c "
SELECT medicine_id, medicine_name, medicine_power, category, price 
FROM pulseiq.medicine 
WHERE is_active = true
ORDER BY category, medicine_name;
"

rm -f /tmp/medicine_inserts.sql

echo ""
echo "=== MEDICINE DEBUG COMPLETE ==="
