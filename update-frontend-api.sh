#!/bin/bash

# Script to update all components to use API_CONFIG instead of hardcoded BASE_URL
# This script will update frontend components to use the centralized API configuration

echo "🔧 PulseIQ Frontend API Configuration Update Script"
echo "=================================================="

# Define the frontend source directory
FRONTEND_SRC="/Users/mohammad/Downloads/Telegram Desktop/pulse-iq/frontend/src"

# Function to update a component file
update_component() {
    local file_path="$1"
    local component_name=$(basename "$file_path" .tsx)
    
    echo "📝 Updating $component_name..."
    
    # Check if file exists
    if [ ! -f "$file_path" ]; then
        echo "❌ File not found: $file_path"
        return 1
    fi
    
    # Create backup
    cp "$file_path" "$file_path.backup"
    
    # Add API import if not already present
    if ! grep -q "import.*API_CONFIG.*from.*@/config/api" "$file_path"; then
        # Find the last import line and add our import after it
        sed -i '' '/^import.*from/a\
import { API_CONFIG, apiCall } from '\''@/config/api'\'';
' "$file_path"
    fi
    
    # Remove BASE_URL constant definition
    sed -i '' '/^const BASE_URL = import\.meta\.env\.VITE_BACKEND_URL/d' "$file_path"
    
    # Replace fetch calls with apiCall where appropriate
    # Pattern 1: fetch(`${BASE_URL}/api/...`, { method: 'GET', headers: {...} })
    sed -i '' 's/fetch(`\${BASE_URL}\(\/api\/[^`]*\)`, {[^}]*method: '\''GET'\''[^}]*headers:[^}]*})/apiCall(`${API_CONFIG.USER_APPOINTMENT_BASE_URL}\1`, { method: '\''GET'\'' })/g' "$file_path"
    
    # Pattern 2: fetch(`${BASE_URL}/api/...`, { method: 'POST', ... })
    sed -i '' 's/fetch(`\${BASE_URL}\(\/api\/[^`]*\)`, {[^}]*method: '\''POST'\''[^}]*body: \([^,}]*\)[^}]*})/apiCall(`${API_CONFIG.USER_APPOINTMENT_BASE_URL}\1`, { method: '\''POST'\'', body: \2 }, false)/g' "$file_path"
    
    # Pattern 3: Simple fetch calls with BASE_URL
    sed -i '' 's/\${BASE_URL}\/api\//${API_CONFIG.USER_APPOINTMENT_BASE_URL}\/api\//g' "$file_path"
    
    echo "✅ Updated $component_name"
}

# List of components that need updating
declare -a components=(
    "$FRONTEND_SRC/components/dashboards/PatientDashboard.tsx"
    "$FRONTEND_SRC/components/dashboards/DoctorDashboard.tsx"
    "$FRONTEND_SRC/components/appointments/BookAppointment.tsx"
    "$FRONTEND_SRC/components/appointments/AppointmentList.tsx"
    "$FRONTEND_SRC/components/TestResults/TestResultUpload.tsx"
    "$FRONTEND_SRC/components/TestResults/DoctorTestResults.tsx"
    "$FRONTEND_SRC/components/TestResults/TechnicianTestResults.tsx"
)

echo "🚀 Starting component updates..."
echo ""

# Update each component
for component in "${components[@]}"; do
    update_component "$component"
done

echo ""
echo "🔍 Checking for any remaining BASE_URL references..."

# Search for any remaining BASE_URL references
remaining_refs=$(grep -r "BASE_URL" "$FRONTEND_SRC" --include="*.tsx" --include="*.ts" 2>/dev/null || true)

if [ -n "$remaining_refs" ]; then
    echo "⚠️  Found remaining BASE_URL references:"
    echo "$remaining_refs"
    echo ""
    echo "These may need manual review."
else
    echo "✅ No remaining BASE_URL references found!"
fi

echo ""
echo "🔍 Checking for any remaining hardcoded localhost:8085 references..."

# Search for any remaining localhost references
localhost_refs=$(grep -r "localhost:8085" "$FRONTEND_SRC" --include="*.tsx" --include="*.ts" 2>/dev/null || true)

if [ -n "$localhost_refs" ]; then
    echo "⚠️  Found remaining localhost:8085 references:"
    echo "$localhost_refs"
    echo ""
    echo "These may need manual review."
else
    echo "✅ No remaining localhost:8085 references found!"
fi

echo ""
echo "📋 Summary of changes:"
echo "- Added API_CONFIG imports to components"
echo "- Removed BASE_URL constant definitions"
echo "- Updated fetch calls to use apiCall helper"
echo "- Replaced hardcoded URLs with API_CONFIG references"
echo ""
echo "💡 Next steps:"
echo "1. Test the application locally to ensure all API calls work"
echo "2. Deploy to verify PUBLIC_IP environment variables are working"
echo "3. Remove .backup files if everything works correctly"
echo ""
echo "🎉 Component update script completed!"
