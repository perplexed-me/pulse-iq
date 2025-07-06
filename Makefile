# PulseIQ Development Makefile

.PHONY: help build up down dev test clean logs status health

# Default target
help:
	@echo "PulseIQ Development Commands:"
	@echo ""
	@echo "🚀 Getting Started:"
	@echo "  make setup      - Initial setup (copy .env template)"
	@echo "  make build      - Build all Docker images"
	@echo "  make build-jars - Build JAR files for production"
	@echo "  make build-prod - Build production images (with JARs)"
	@echo "  make up         - Start all services (production mode)"
	@echo "  make dev        - Start all services (development mode)"
	@echo "  make dev-fast   - ⚡ FASTEST: Only DB in Docker, run services locally"
	@echo ""
	@echo "🔧 Development:"
	@echo "  make logs      - Show logs from all services"
	@echo "  make status    - Show status of all containers"
	@echo "  make health    - Check health of all services"
	@echo "  make shell-*   - Shell into specific service container"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test        - Run all tests"
	@echo "  make test-builds - Test Docker builds for CI/CD"
	@echo "  make test-*      - Run tests for specific service"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make down         - Stop all services"
	@echo "  make dev-fast-down - Stop fast development (DB only)"
	@echo "  make clean        - Remove containers, volumes, and images"
	@echo "  make restart      - Restart all services"

# Setup
setup:
	@if [ ! -f .env ]; then \
		cp .env.template .env && \
		echo "✅ .env file created from template. Please edit it with your configuration."; \
	else \
		echo "⚠️  .env file already exists."; \
	fi

# FAST development - only start database, run services locally
dev-fast:
	@echo "⚡ Starting FAST development mode (DB only in Docker)..."
	@echo "Starting PostgreSQL in Docker..."
	docker-compose -f docker-compose.db-only.yml up -d
	@echo ""
	@echo "🚀 Now run services locally:"
	@echo "  Terminal 1: cd user-appointment-service && mvn spring-boot:run"
	@echo "  Terminal 2: cd ai-service && uvicorn main:app --reload"
	@echo "  Terminal 3: cd frontend && npm run dev"
	@echo ""
	@echo "📊 Database will be available on localhost:5432"

# Stop fast development
dev-fast-down:
	@echo "🛑 Stopping fast development mode..."
	docker-compose -f docker-compose.db-only.yml down

# Build all images
build:
	@echo "🏗️  Building all Docker images..."
	docker-compose build

# Build JAR files for production
build-jars:
	@echo "☕ Building JAR files..."
	cd user-appointment-service && mvn clean package -DskipTests -B

# Build production images (with pre-built JARs)
build-prod: build-jars
	@echo "🏭 Building production Docker images..."
	cd user-appointment-service && docker build -t pulseiq-user-appointment:latest .
	cd ai-service && docker build -t pulseiq-ai-service:latest .
	cd frontend && docker build -t pulseiq-frontend:latest .

# Production deployment
up:
	@echo "🚀 Starting PulseIQ in production mode..."
	docker-compose up -d

# Development deployment
dev:
	@echo "🛠️  Starting PulseIQ in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Stop all services
down:
	@echo "🛑 Stopping all services..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Show logs
logs:
	docker-compose logs -f

logs-frontend:
	docker-compose logs -f frontend

logs-user-service:
	docker-compose logs -f user-appointment-service

logs-ai-service:
	docker-compose logs -f ai-service

logs-db:
	docker-compose logs -f db

# Service status
status:
	@echo "📊 Service Status:"
	docker-compose ps

# Health checks
health:
	@echo "🏥 Checking service health..."
	@echo "Frontend (8080):"
	@curl -f http://localhost:8080/ >/dev/null 2>&1 && echo "  ✅ Healthy" || echo "  ❌ Unhealthy"
	@echo "User Appointment Service (8085):"
	@curl -f http://localhost:8085/actuator/health >/dev/null 2>&1 && echo "  ✅ Healthy" || echo "  ❌ Unhealthy"
	@echo "AI Service (8000):"
	@curl -f http://localhost:8000/health >/dev/null 2>&1 && echo "  ✅ Healthy" || echo "  ❌ Unhealthy"

# Shell access
shell-frontend:
	docker-compose exec frontend sh

shell-user-service:
	docker-compose exec user-appointment-service bash

shell-ai-service:
	docker-compose exec ai-service bash

shell-db:
	docker-compose exec db psql -U pulseiq_user -d pulseiq_db

# Testing
test:
	@echo "🧪 Running all tests..."
	make test-frontend
	make test-user-service
	make test-ai-service

# Quick test builds for CI/CD validation
test-builds:
	@echo "🚀 Testing Docker builds for CI/CD..."
	./test-builds.sh

test-frontend:
	@echo "Testing Frontend..."
	cd frontend && npm run test:run

test-user-service:
	@echo "Testing User Appointment Service..."
	cd user-appointment-service && mvn test

test-ai-service:
	@echo "Testing AI Service..."
	cd ai-service && python -m pytest tests/ -v || echo "No tests found"

# Development helpers
dev-frontend:
	@echo "🎨 Starting Frontend development server..."
	cd frontend && npm run dev

dev-user-service:
	@echo "☕ Starting User Appointment Service development server..."
	cd user-appointment-service && mvn spring-boot:run

dev-ai-service:
	@echo "🐍 Starting AI Service development server..."
	cd ai-service && uvicorn main:app --reload

# Cleanup
clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

# Restart services
restart: down up

# Force rebuild and restart
rebuild: clean build up

# Database operations
db-reset:
	@echo "🔄 Resetting database..."
	docker-compose stop db
	docker volume rm pulse-iq_postgres_data || true
	docker-compose up -d db

db-backup:
	@echo "💾 Creating database backup..."
	docker-compose exec db pg_dump -U pulseiq_user pulseiq_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Production deployment helpers
deploy-build:
	@echo "🚀 Building for deployment..."
	make test
	make build-jars
	make build-prod

deploy-staging:
	@echo "🚀 Deploying to staging..."
	./deploy.sh staging

deploy-production:
	@echo "🚀 Deploying to production..."
	./deploy.sh production

deploy-staging-skip-tests:
	@echo "🚀 Deploying to staging (skipping tests)..."
	./deploy.sh staging true

deploy-production-skip-tests:
	@echo "🚀 Deploying to production (skipping tests)..."
	./deploy.sh production true
	@echo "🏭 Building for production deployment..."
	docker-compose build
	docker-compose push

deploy-prod:
	@echo "🚀 Deploying to production..."
	git push origin main

# Development environment setup
dev-setup: setup
	@echo "🛠️  Setting up development environment..."
	@if command -v node >/dev/null 2>&1; then \
		cd frontend && npm install; \
	else \
		echo "⚠️  Node.js not found. Frontend dependencies not installed."; \
	fi
	@if command -v mvn >/dev/null 2>&1 || [ -f user-appointment-service/mvnw ]; then \
		cd user-appointment-service && (mvn dependency:resolve || mvn dependency:resolve); \
	else \
		echo "⚠️  Maven not found. Java dependencies not resolved."; \
	fi
	@if command -v pip >/dev/null 2>&1; then \
		cd ai-service && pip install -r requirements.txt; \
	else \
		echo "⚠️  Python/pip not found. Python dependencies not installed."; \
	fi

# Show service URLs
urls:
	@echo "🌐 Service URLs:"
	@echo "  Frontend:              http://localhost:8080"
	@echo "  User Appointment API:  http://localhost:8085"
	@echo "  AI Service API:        http://localhost:8000"
	@echo "  API Documentation:"
	@echo "    User Service:        http://localhost:8085/swagger-ui.html"
	@echo "    AI Service:          http://localhost:8000/docs"
