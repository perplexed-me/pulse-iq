#!/bin/bash

# Simple Frontend API Fix Script
# This script identifies remaining components that need updates

echo "🔍 Scanning for remaining frontend components that need API updates..."
echo ""

FRONTEND_SRC="/Users/mohammad/Downloads/Telegram Desktop/pulse-iq/frontend/src"

echo "📋 Components with BASE_URL references:"
grep -r "const BASE_URL" "$FRONTEND_SRC" --include="*.tsx" --include="*.ts" 2>/dev/null | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    component=$(basename "$file" .tsx)
    echo "  - $component ($file)"
done

echo ""
echo "📋 Components with hardcoded localhost:8085:"
grep -r "localhost:8085" "$FRONTEND_SRC" --include="*.tsx" --include="*.ts" 2>/dev/null | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    component=$(basename "$file" .tsx)
    echo "  - $component ($file)"
done

echo ""
echo "📋 Components with hardcoded IP 132.196.64.104:8085:"
grep -r "132.196.64.104:8085" "$FRONTEND_SRC" --include="*.tsx" --include="*.ts" 2>/dev/null | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    component=$(basename "$file" .tsx)
    echo "  - $component ($file)"
done

echo ""
echo "🔧 Quick Fix Instructions:"
echo ""
echo "For each component listed above, you need to:"
echo "1. Add this import: import { API_CONFIG, apiCall } from '@/config/api';"
echo "2. Remove line: const BASE_URL = import.meta.env.VITE_BACKEND_URL || \"...\";"
echo "3. Replace fetch calls with apiCall and use API_CONFIG endpoints"
echo ""
echo "📖 Common replacements:"
echo "  fetch(\`\${BASE_URL}/api/...\`) → apiCall(API_CONFIG.*.*, { method: 'GET' })"
echo "  \${BASE_URL}/api/auth/profile → API_CONFIG.AUTH.PROFILE"
echo "  \${BASE_URL}/api/appointments/... → API_CONFIG.APPOINTMENTS.*"
echo "  \${BASE_URL}/api/test-results/... → API_CONFIG.TEST_RESULTS.*"
echo ""
echo "✅ Components already fixed:"
echo "  - Register.tsx"
echo "  - AdminDashboard.tsx"
echo "  - Login.tsx"
echo "  - AuthContext.tsx"
echo "  - PatientDashboard.tsx"
echo "  - DoctorProfilePicture.tsx"
echo "  - PatientTestResults.tsx"
echo "  - TechnicianDashboard.tsx"
