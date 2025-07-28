@echo off
echo === WINDOWS MEDICINE INSERT SCRIPT ===
echo This script will ensure medicine data is properly inserted into the database
echo.

REM Check if database container is running
for /f "tokens=*" %%i in ('docker ps --format "{{.Names}}" ^| findstr postgres') do set POSTGRES_CONTAINER=%%i

if "%POSTGRES_CONTAINER%"=="" (
    echo ❌ PostgreSQL container not found. Starting database...
    if exist docker-compose.yml (
        docker-compose up -d db
        timeout /t 10 /nobreak > nul
        for /f "tokens=*" %%i in ('docker ps --format "{{.Names}}" ^| findstr postgres') do set POSTGRES_CONTAINER=%%i
    ) else (
        echo No docker-compose.yml found. Cannot start database.
        pause
        exit /b 1
    )
)

echo ✅ PostgreSQL container: %POSTGRES_CONTAINER%
echo.

echo === 1. Check current medicine count ===
for /f "tokens=*" %%i in ('docker exec -e PGPASSWORD^="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -t -c "SELECT COUNT(*) FROM pulseiq.medicine;" ^| tr -d " "') do set CURRENT_COUNT=%%i
echo Current medicines in database: %CURRENT_COUNT%

if %CURRENT_COUNT% GTR 10 (
    echo ✅ Medicine data already exists ^(%CURRENT_COUNT% medicines^)
    echo Listing current medicines:
    docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "SELECT medicine_id, medicine_name, medicine_power, category FROM pulseiq.medicine WHERE is_active = true ORDER BY category, medicine_name;"
    pause
    exit /b 0
)

echo.
echo === 2. Medicine data missing or incomplete. Inserting medicines... ===

REM Create SQL file with medicine inserts using UPSERT
echo -- Set search path > %TEMP%\force_medicine_insert.sql
echo SET search_path TO pulseiq, public; >> %TEMP%\force_medicine_insert.sql
echo. >> %TEMP%\force_medicine_insert.sql
echo -- Force insert medicine data with UPSERT >> %TEMP%\force_medicine_insert.sql
echo INSERT INTO pulseiq.medicine (medicine_name, medicine_power, medicine_image, description, category, manufacturer, price, is_active) VALUES >> %TEMP%\force_medicine_insert.sql
echo ('Paracetamol', '500mg', '/images/medicines/paracetamol.jpg', 'Pain reliever and fever reducer', 'Pain Relief', 'GSK', 8.50, true), >> %TEMP%\force_medicine_insert.sql
echo ('Ibuprofen', '400mg', '/images/medicines/ibuprofen.jpg', 'Anti-inflammatory pain reliever', 'Pain Relief', 'Johnson ^& Johnson', 12.00, true), >> %TEMP%\force_medicine_insert.sql
echo ('Aspirin', '300mg', '/images/medicines/aspirin.jpg', 'Pain reliever and blood thinner', 'Pain Relief', 'Bayer', 10.00, true), >> %TEMP%\force_medicine_insert.sql
echo ('Amoxicillin', '500mg', '/images/medicines/amoxicillin.jpg', 'Antibiotic used to treat bacterial infections', 'Antibiotic', 'Pfizer', 15.50, true), >> %TEMP%\force_medicine_insert.sql
echo ('Azithromycin', '250mg', '/images/medicines/azithromycin.jpg', 'Antibiotic used to treat various bacterial infections', 'Antibiotic', 'Novartis', 25.00, true), >> %TEMP%\force_medicine_insert.sql
echo ('Vitamin D3', '1000 IU', '/images/medicines/vitamin-d3.jpg', 'Vitamin D supplement for bone health', 'Vitamin', 'Nature Made', 20.00, true), >> %TEMP%\force_medicine_insert.sql
echo ('Vitamin C', '1000mg', '/images/medicines/vitamin-c.jpg', 'Vitamin C for immune support', 'Vitamin', 'Emergen-C', 18.00, true), >> %TEMP%\force_medicine_insert.sql
echo ('Omeprazole', '20mg', '/images/medicines/omeprazole.jpg', 'Proton pump inhibitor for acid reflux', 'Gastric', 'Prilosec', 30.00, true), >> %TEMP%\force_medicine_insert.sql
echo ('Loratadine', '10mg', '/images/medicines/loratadine.jpg', 'Antihistamine for allergies', 'Allergy', 'Claritin', 22.00, true), >> %TEMP%\force_medicine_insert.sql
echo ('Cetirizine', '10mg', '/images/medicines/cetirizine.jpg', 'Antihistamine for allergies', 'Allergy', 'Zyrtec', 24.00, true) >> %TEMP%\force_medicine_insert.sql
echo ON CONFLICT (medicine_name, medicine_power) DO UPDATE SET  >> %TEMP%\force_medicine_insert.sql
echo     description = EXCLUDED.description, >> %TEMP%\force_medicine_insert.sql
echo     category = EXCLUDED.category, >> %TEMP%\force_medicine_insert.sql
echo     manufacturer = EXCLUDED.manufacturer, >> %TEMP%\force_medicine_insert.sql
echo     price = EXCLUDED.price, >> %TEMP%\force_medicine_insert.sql
echo     medicine_image = EXCLUDED.medicine_image, >> %TEMP%\force_medicine_insert.sql
echo     is_active = EXCLUDED.is_active; >> %TEMP%\force_medicine_insert.sql
echo. >> %TEMP%\force_medicine_insert.sql
echo SELECT 'Medicine data insertion completed!' as status; >> %TEMP%\force_medicine_insert.sql
echo SELECT COUNT(*) as total_medicines FROM pulseiq.medicine; >> %TEMP%\force_medicine_insert.sql

REM Copy and execute the SQL file
docker cp "%TEMP%\force_medicine_insert.sql" "%POSTGRES_CONTAINER%":/tmp/force_medicine_insert.sql
echo Executing medicine insert script...
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -f /tmp/force_medicine_insert.sql

echo.
echo === 3. Verify medicine data insertion ===
for /f "tokens=*" %%i in ('docker exec -e PGPASSWORD^="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -t -c "SELECT COUNT(*) FROM pulseiq.medicine;" ^| tr -d " "') do set NEW_COUNT=%%i
echo Medicines in database after insert: %NEW_COUNT%

echo.
echo === 4. List all available medicines for doctors ===
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "SELECT medicine_id, medicine_name, medicine_power, category, price FROM pulseiq.medicine WHERE is_active = true ORDER BY category, medicine_name;"

REM Clean up
del "%TEMP%\force_medicine_insert.sql"

echo.
echo === MEDICINE INSERT COMPLETE ===
echo ✅ Doctors should now be able to select medicines from the database
echo ✅ Total medicines available: %NEW_COUNT%
echo.
echo To verify from application, doctors can now:
echo 1. Create prescriptions
echo 2. Search and select from available medicines
echo 3. View medicine details including name, power, category, and price
pause
