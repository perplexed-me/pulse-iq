#!/bin/bash

echo "=== FORCE MEDICINE INSERT SCRIPT ==="
echo "This script will ensure medicine data is properly inserted into the database"
echo ""

# Check if database container is running
POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep postgres | head -1)
if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL container not found. Starting database..."
    if [ -f docker-compose.yml ]; then
        docker-compose up -d postgres
        sleep 10
        POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep postgres | head -1)
    else
        echo "No docker-compose.yml found. Cannot start database."
        exit 1
    fi
fi

echo "✅ PostgreSQL container: $POSTGRES_CONTAINER"
echo ""

# Set database password from environment or use default
if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  DB_PASSWORD environment variable not set. Please set it:"
    echo "   export DB_PASSWORD=your_actual_password"
    echo "   Or run: DB_PASSWORD=your_password ./force-medicine-insert.sh"
    exit 1
fi
echo "Using database password: [hidden]"

echo "=== 1. Check current medicine count ==="
CURRENT_COUNT=$(docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -t -c "SELECT COUNT(*) FROM pulseiq.medicine;" | tr -d ' ')
echo "Current medicines in database: $CURRENT_COUNT"

if [ "$CURRENT_COUNT" -gt 10 ]; then
    echo "✅ Medicine data already exists ($CURRENT_COUNT medicines)"
    echo "Listing current medicines:"
    docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
    SELECT medicine_id, medicine_name, medicine_power, category 
    FROM pulseiq.medicine 
    WHERE is_active = true 
    ORDER BY category, medicine_name;
    "
    exit 0
fi

echo ""
echo "=== 2. Medicine data missing or incomplete. Inserting medicines... ==="

# First check if unique constraint exists and add it if missing
echo "Checking if unique constraint exists..."
CONSTRAINT_EXISTS=$(docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -t -c "SELECT COUNT(*) FROM pg_constraint WHERE conname = 'uk_medicine_name_power';" | tr -d ' ')

if [ "$CONSTRAINT_EXISTS" -eq 0 ]; then
    echo "Adding missing unique constraint..."
    CONSTRAINT_RESULT=$(docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "ALTER TABLE pulseiq.medicine ADD CONSTRAINT uk_medicine_name_power UNIQUE (medicine_name, medicine_power);" 2>&1)
    if [[ $CONSTRAINT_RESULT == *"ERROR"* ]]; then
        echo "❌ Failed to add constraint: $CONSTRAINT_RESULT"
        echo "This might be due to duplicate data. Let's check..."
        docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "SELECT medicine_name, medicine_power, COUNT(*) FROM pulseiq.medicine GROUP BY medicine_name, medicine_power HAVING COUNT(*) > 1;"
        exit 1
    else
        echo "✅ Unique constraint added successfully"
    fi
else
    echo "✅ Unique constraint already exists"
fi

# Create SQL file with medicine inserts using UPSERT
cat > /tmp/force_medicine_insert.sql << 'EOF'
-- Set search path
SET search_path TO pulseiq, public;

-- Force insert medicine data with UPSERT (INSERT ... ON CONFLICT ... DO UPDATE)
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
SELECT 'Medicine data insertion completed!' as status;
SELECT COUNT(*) as total_medicines FROM pulseiq.medicine;
SELECT category, COUNT(*) as count FROM pulseiq.medicine WHERE is_active = true GROUP BY category ORDER BY category;
EOF

# Copy and execute the SQL file
docker cp /tmp/force_medicine_insert.sql "$POSTGRES_CONTAINER":/tmp/force_medicine_insert.sql
echo "Executing medicine insert script..."
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -f /tmp/force_medicine_insert.sql

echo ""
echo "=== 3. Verify medicine data insertion ==="
NEW_COUNT=$(docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -t -c "SELECT COUNT(*) FROM pulseiq.medicine;" | tr -d ' ')
echo "Medicines in database after insert: $NEW_COUNT"

echo ""
echo "=== 4. List all available medicines for doctors ==="
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
SELECT 
    medicine_id,
    medicine_name,
    medicine_power,
    category,
    manufacturer,
    price
FROM pulseiq.medicine 
WHERE is_active = true 
ORDER BY category, medicine_name;
"

echo ""
echo "=== 5. Test doctor medicine query ==="
echo "Testing the query that doctors would use to fetch medicines:"
docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER" psql -U pulseiq_user -d pulseiq_db -c "
SELECT 
    m.medicine_id,
    m.medicine_name,
    m.medicine_power,
    m.category,
    m.price
FROM pulseiq.medicine m 
WHERE m.is_active = true 
    AND m.category IN ('Pain Relief', 'Antibiotic', 'Vitamin')
ORDER BY m.category, m.medicine_name
LIMIT 10;
"

# Clean up
rm -f /tmp/force_medicine_insert.sql

echo ""
echo "=== MEDICINE INSERT COMPLETE ==="
echo "✅ Doctors should now be able to select medicines from the database"
echo "✅ Total medicines available: $NEW_COUNT"
echo ""
echo "To verify from application, doctors can now:"
echo "1. Create prescriptions"
echo "2. Search and select from available medicines"
echo "3. View medicine details including name, power, category, and price"
