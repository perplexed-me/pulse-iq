@echo off
echo === FIX MEDICINE TABLE CONSTRAINT ===
echo This script will fix the missing unique constraint and insert medicine data
echo.

REM Get the PostgreSQL container name
for /f "tokens=*" %%i in ('docker ps --format "{{.Names}}" ^| findstr postgres') do set POSTGRES_CONTAINER=%%i

if "%POSTGRES_CONTAINER%"=="" (
    echo ❌ PostgreSQL container not found!
    pause
    exit /b 1
)

echo ✅ PostgreSQL container: %POSTGRES_CONTAINER%
echo.

echo === 1. Check current table structure ===
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "\d pulseiq.medicine"

echo.
echo === 2. Check existing constraints ===
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "SELECT conname, contype, pg_get_constraintdef(oid) as definition FROM pg_constraint WHERE conrelid = 'pulseiq.medicine'::regclass;"

echo.
echo === 3. Add missing unique constraint ===
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "ALTER TABLE pulseiq.medicine ADD CONSTRAINT uk_medicine_name_power UNIQUE (medicine_name, medicine_power);"

echo.
echo === 4. Verify constraint was added ===
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "SELECT conname, contype, pg_get_constraintdef(oid) as definition FROM pg_constraint WHERE conrelid = 'pulseiq.medicine'::regclass AND contype = 'u';"

echo.
echo === 5. Now insert medicine data with working ON CONFLICT ===

REM Create SQL file with working medicine inserts
echo -- Set search path > %TEMP%\fix_medicine_insert.sql
echo SET search_path TO pulseiq, public; >> %TEMP%\fix_medicine_insert.sql
echo. >> %TEMP%\fix_medicine_insert.sql
echo -- Insert medicine data with working UPSERT >> %TEMP%\fix_medicine_insert.sql
echo INSERT INTO pulseiq.medicine (medicine_name, medicine_power, medicine_image, description, category, manufacturer, price, is_active) VALUES >> %TEMP%\fix_medicine_insert.sql
echo ('Paracetamol', '500mg', '/images/medicines/paracetamol.jpg', 'Pain reliever and fever reducer', 'Pain Relief', 'GSK', 8.50, true), >> %TEMP%\fix_medicine_insert.sql
echo ('Ibuprofen', '400mg', '/images/medicines/ibuprofen.jpg', 'Anti-inflammatory pain reliever', 'Pain Relief', 'Johnson ^& Johnson', 12.00, true), >> %TEMP%\fix_medicine_insert.sql
echo ('Aspirin', '300mg', '/images/medicines/aspirin.jpg', 'Pain reliever and blood thinner', 'Pain Relief', 'Bayer', 10.00, true), >> %TEMP%\fix_medicine_insert.sql
echo ('Amoxicillin', '500mg', '/images/medicines/amoxicillin.jpg', 'Antibiotic used to treat bacterial infections', 'Antibiotic', 'Pfizer', 15.50, true), >> %TEMP%\fix_medicine_insert.sql
echo ('Azithromycin', '250mg', '/images/medicines/azithromycin.jpg', 'Antibiotic used to treat various bacterial infections', 'Antibiotic', 'Novartis', 25.00, true), >> %TEMP%\fix_medicine_insert.sql
echo ('Vitamin D3', '1000 IU', '/images/medicines/vitamin-d3.jpg', 'Vitamin D supplement for bone health', 'Vitamin', 'Nature Made', 20.00, true), >> %TEMP%\fix_medicine_insert.sql
echo ('Vitamin C', '1000mg', '/images/medicines/vitamin-c.jpg', 'Vitamin C for immune support', 'Vitamin', 'Emergen-C', 18.00, true), >> %TEMP%\fix_medicine_insert.sql
echo ('Omeprazole', '20mg', '/images/medicines/omeprazole.jpg', 'Proton pump inhibitor for acid reflux', 'Gastric', 'Prilosec', 30.00, true), >> %TEMP%\fix_medicine_insert.sql
echo ('Loratadine', '10mg', '/images/medicines/loratadine.jpg', 'Antihistamine for allergies', 'Allergy', 'Claritin', 22.00, true), >> %TEMP%\fix_medicine_insert.sql
echo ('Cetirizine', '10mg', '/images/medicines/cetirizine.jpg', 'Antihistamine for allergies', 'Allergy', 'Zyrtec', 24.00, true) >> %TEMP%\fix_medicine_insert.sql
echo ON CONFLICT (medicine_name, medicine_power) DO UPDATE SET >> %TEMP%\fix_medicine_insert.sql
echo     description = EXCLUDED.description, >> %TEMP%\fix_medicine_insert.sql
echo     category = EXCLUDED.category, >> %TEMP%\fix_medicine_insert.sql
echo     manufacturer = EXCLUDED.manufacturer, >> %TEMP%\fix_medicine_insert.sql
echo     price = EXCLUDED.price, >> %TEMP%\fix_medicine_insert.sql
echo     medicine_image = EXCLUDED.medicine_image, >> %TEMP%\fix_medicine_insert.sql
echo     is_active = EXCLUDED.is_active; >> %TEMP%\fix_medicine_insert.sql
echo. >> %TEMP%\fix_medicine_insert.sql
echo SELECT 'Medicine data insertion completed successfully!' as status; >> %TEMP%\fix_medicine_insert.sql
echo SELECT COUNT(*) as total_medicines FROM pulseiq.medicine; >> %TEMP%\fix_medicine_insert.sql
echo SELECT category, COUNT(*) as count FROM pulseiq.medicine WHERE is_active = true GROUP BY category ORDER BY category; >> %TEMP%\fix_medicine_insert.sql

REM Copy and execute the SQL file
docker cp "%TEMP%\fix_medicine_insert.sql" "%POSTGRES_CONTAINER%":/tmp/fix_medicine_insert.sql
echo Executing fixed medicine insert script...
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -f /tmp/fix_medicine_insert.sql

echo.
echo === 6. Final verification ===
for /f "tokens=*" %%i in ('docker exec -e PGPASSWORD^="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -t -c "SELECT COUNT(*) FROM pulseiq.medicine;" ^| tr -d " "') do set FINAL_COUNT=%%i
echo Final medicine count: %FINAL_COUNT%

echo.
echo === 7. List inserted medicines ===
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "SELECT medicine_id, medicine_name, medicine_power, category, price FROM pulseiq.medicine WHERE is_active = true ORDER BY category, medicine_name;"

REM Clean up
del "%TEMP%\fix_medicine_insert.sql"

echo.
echo === FIX COMPLETE ===
if %FINAL_COUNT% GTR 0 (
    echo ✅ SUCCESS: %FINAL_COUNT% medicines inserted!
    echo ✅ Doctors can now select medicines for prescriptions
) else (
    echo ❌ FAILED: No medicines were inserted
)
pause
