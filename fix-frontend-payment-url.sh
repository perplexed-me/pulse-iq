#!/bin/bash

echo "=== FRONTEND PAYMENT URL FIX ==="
echo "This script will rebuild the frontend with correct payment service URL"
echo ""

PUBLIC_IP="132.196.64.104"

echo "=== 1. Stopping current frontend ==="
docker stop pulseiq_frontend 2>/dev/null || echo "Frontend container not running"
docker rm pulseiq_frontend 2>/dev/null || echo "Frontend container already removed"

echo ""
echo "=== 2. Building frontend with correct environment variables ==="
cd frontend

echo "Building with:"
echo "VITE_PAYMENT_SERVICE_API_URL=http://$PUBLIC_IP:8082"
echo "VITE_USER_APPOINTMENT_API_URL=http://$PUBLIC_IP:8085"
echo "VITE_AI_SERVICE_API_URL=http://$PUBLIC_IP:8000"

docker build \
  --build-arg VITE_USER_APPOINTMENT_API_URL=http://$PUBLIC_IP:8085 \
  --build-arg VITE_PAYMENT_SERVICE_API_URL=http://$PUBLIC_IP:8082 \
  --build-arg VITE_AI_SERVICE_API_URL=http://$PUBLIC_IP:8000 \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --build-arg VITE_FIREBASE_MEASUREMENT_ID="$VITE_FIREBASE_MEASUREMENT_ID" \
  -t pulseiq-frontend:latest .

echo ""
echo "=== 3. Starting frontend with correct configuration ==="
docker run -d \
  --name pulseiq_frontend \
  --network pulse-iq-network \
  -p 8080:8080 \
  -e FRONTEND_ORIGIN=http://$PUBLIC_IP:8080 \
  -e APP_CORS_ALLOWED_ORIGINS=http://$PUBLIC_IP:8080 \
  --restart unless-stopped \
  pulseiq-frontend:latest

echo ""
echo "=== 4. Waiting for frontend to start ==="
sleep 10

echo ""
echo "=== 5. Testing frontend ==="
curl -s -w "Frontend health: %{http_code}\n" http://localhost:8080/ > /dev/null || echo "Frontend not accessible"

echo ""
echo "=== 6. Checking frontend build for correct URLs ==="
docker exec pulseiq_frontend grep -r "132.196.64.104:8082" /usr/share/nginx/html/ 2>/dev/null | head -3 || echo "❌ Frontend still using localhost URLs"

echo ""
echo "=== FRONTEND FIX COMPLETE ==="
echo "Frontend should now use http://132.196.64.104:8082 for payment service"
echo "Test the payment initiation in the browser to verify the fix"
