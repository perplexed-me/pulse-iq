@echo off
echo === DATABASE CONNECTION TEST ===
echo.

REM Get the PostgreSQL container name
for /f "tokens=*" %%i in ('docker ps --format "{{.Names}}" ^| findstr postgres') do set POSTGRES_CONTAINER=%%i

if "%POSTGRES_CONTAINER%"=="" (
    echo ❌ PostgreSQL container not found!
    echo Available containers:
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    pause
    exit /b 1
)

echo ✅ PostgreSQL container: %POSTGRES_CONTAINER%
echo.

echo === Testing different database connections ===

echo 1. Testing connection as pulseiq_user to pulseiq_db:
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "SELECT current_database(), current_user, current_schema();"

echo.
echo 2. Testing connection as postgres to pulseiq_db:
docker exec "%POSTGRES_CONTAINER%" psql -U postgres -d pulseiq_db -c "SELECT current_database(), current_user, current_schema();"

echo.
echo 3. Checking if pulseiq schema exists:
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'pulseiq';"

echo.
echo 4. Checking if medicine table exists:
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'pulseiq' AND table_name = 'medicine';"

echo.
echo 5. If medicine table exists, check row count:
docker exec -e PGPASSWORD="%DB_PASSWORD%" "%POSTGRES_CONTAINER%" psql -U pulseiq_user -d pulseiq_db -c "SELECT COUNT(*) as medicine_count FROM pulseiq.medicine;" 2>nul || echo "Medicine table does not exist or cannot be accessed"

echo.
echo 6. Check database and user configuration:
docker exec "%POSTGRES_CONTAINER%" psql -U postgres -c "SELECT datname FROM pg_database WHERE datname LIKE '%%pulse%%';"
docker exec "%POSTGRES_CONTAINER%" psql -U postgres -c "SELECT rolname FROM pg_roles WHERE rolname LIKE '%%pulse%%';"

echo.
echo === CONNECTION TEST COMPLETE ===
pause
