#!/bin/bash

# Quick test script to validate Docker builds before CI/CD
echo "🚀 Testing PulseIQ Docker builds for CI/CD..."
echo "============================================="

# Set JWT_SECRET environment variable for tests
export JWT_SECRET="test_jwt_secret_for_ci_only_minimum_32_characters_long_enough"

# Test user appointment service build (the slow one)
echo "📦 Testing User Appointment Service build..."
cd user-appointment-service

echo "  Setting up Maven wrapper..."
chmod +x ./setup-maven.sh
./setup-maven.sh

echo "  Building JAR with Maven..."
if [ -f "./mvnw" ] && [ -x "./mvnw" ] && [ -f ".mvn/wrapper/maven-wrapper.properties" ]; then
    echo "  Using Maven wrapper..."
    ./mvnw clean package -DskipTests -B -Dspring.profiles.active=test
elif command -v mvn &> /dev/null; then
    echo "  Using system Maven..."
    mvn clean package -DskipTests -B -Dspring.profiles.active=test
else
    echo "  ❌ Neither Maven wrapper nor system Maven available"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo "  ❌ Maven build FAILED"
    exit 1
fi

echo "  Building Docker image..."
docker build -t test-user-appointment . --progress=plain

if [ $? -eq 0 ]; then
    echo "  ✅ User Appointment Service build SUCCESS"
else
    echo "  ❌ User Appointment Service Docker build FAILED"
    exit 1
fi

cd ..

# Test AI service build
echo "📦 Testing AI Service build..."
cd ai-service
docker build -t test-ai-service . --progress=plain

if [ $? -eq 0 ]; then
    echo "  ✅ AI Service build SUCCESS"
else
    echo "  ❌ AI Service build FAILED"
    exit 1
fi

cd ..

# Test frontend build
echo "📦 Testing Frontend build..."
cd frontend

echo "  Running lint check..."
npm run lint

if [ $? -ne 0 ]; then
    echo "  ❌ Frontend lint FAILED"
    exit 1
fi

echo "  Building Docker image..."
docker build -t test-frontend . --progress=plain

if [ $? -eq 0 ]; then
    echo "  ✅ Frontend build SUCCESS"
else
    echo "  ❌ Frontend build FAILED"
    exit 1
fi

cd ..

echo ""
echo "🎉 ALL BUILDS SUCCESSFUL!"
echo "🚀 Ready for CI/CD deployment!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub to trigger CI/CD"
echo "2. Check GitHub Actions for automated deployment"
echo "3. Verify deployment on Azure"

# Cleanup test images
echo "🧹 Cleaning up test images..."
docker rmi test-user-appointment test-ai-service test-frontend 2>/dev/null || true

echo "✅ Test complete!"
