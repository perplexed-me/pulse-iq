#!/bin/bash

echo "=== FRONTEND URL DEBUGGING ==="
echo "Date: $(date)"
echo ""

echo "=== 1. Environment Variable Check ==="
echo "VITE_PAYMENT_SERVICE_API_URL: ${VITE_PAYMENT_SERVICE_API_URL:-'NOT SET'}"
echo "VITE_USER_APPOINTMENT_API_URL: ${VITE_USER_APPOINTMENT_API_URL:-'NOT SET'}"
echo "VITE_AI_SERVICE_API_URL: ${VITE_AI_SERVICE_API_URL:-'NOT SET'}"

echo ""
echo "=== 2. Frontend Container Check ==="
FRONTEND_CONTAINER=$(docker ps --format "{{.Names}}" | grep frontend | head -1)
if [ -n "$FRONTEND_CONTAINER" ]; then
    echo "✅ Frontend container found: $FRONTEND_CONTAINER"
    
    echo ""
    echo "=== 3. Frontend Environment Variables ==="
    docker exec "$FRONTEND_CONTAINER" env | grep VITE || echo "No VITE environment variables found"
    
    echo ""
    echo "=== 4. Frontend Build Files Check ==="
    echo "Checking if frontend build has correct URLs..."
    docker exec "$FRONTEND_CONTAINER" grep -r "localhost:8082" /usr/share/nginx/html/ 2>/dev/null || echo "No localhost:8082 references found in build"
    docker exec "$FRONTEND_CONTAINER" grep -r "132.196.64.104:8082" /usr/share/nginx/html/ 2>/dev/null || echo "No Azure IP references found in build"
    
else
    echo "❌ Frontend container not found"
    docker ps | grep -E "(frontend|CONTAINER)" || echo "No containers found"
fi

echo ""
echo "=== 5. Testing Frontend API Config ==="
echo "Testing if frontend can reach payment service..."
curl -s -w "Frontend->Payment: %{http_code}\n" "http://132.196.64.104:8080" > /dev/null || echo "Frontend not accessible"

echo ""
echo "=== 6. Docker Compose Environment Check ==="
if [ -f docker-compose.yml ]; then
    echo "Checking docker-compose environment variables for frontend:"
    grep -A 20 -B 5 "frontend:" docker-compose.yml | grep -E "(VITE_|environment|image)" || echo "No frontend environment config found"
else
    echo "No docker-compose.yml found"
fi

echo ""
echo "=== 7. GitHub Actions Environment Check ==="
if [ -f .github/workflows/cd.yml ]; then
    echo "Checking GitHub Actions deployment environment:"
    grep -A 10 -B 5 "VITE_PAYMENT_SERVICE_API_URL" .github/workflows/cd.yml || echo "No VITE_PAYMENT_SERVICE_API_URL found in GitHub Actions"
else
    echo "No GitHub Actions workflow found"
fi

echo ""
echo "=== DEBUG COMPLETE ==="
