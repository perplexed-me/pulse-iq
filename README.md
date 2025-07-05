# PulseIQ - Healthcare Microservices Platform

[![CI Build & Test](https://github.com/your-username/pulse-iq/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/pulse-iq/actions/workflows/ci.yml)
[![CD Deploy](https://github.com/your-username/pulse-iq/actions/workflows/cd.yml/badge.svg)](https://github.com/your-username/pulse-iq/actions/workflows/cd.yml)

A comprehensive healthcare platform built with modern microservices architecture, featuring AI-powered health assistance, appointment management, and patient care coordination.

## 🏗️ Architecture

PulseIQ consists of four main services:

- **Frontend** (React + Vite + TypeScript) - User interface on port 8080
- **User Appointment Service** (Java Spring Boot) - Patient and appointment management on port 8085
- **AI Service** (Python FastAPI) - AI-powered health consultation on port 8000
- **Database** (PostgreSQL) - Data persistence

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- (Optional) Node.js 20+, Java 21+, Python 3.11+ for local development

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/pulse-iq.git
cd pulse-iq
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.template .env

# Edit .env with your configuration
nano .env
```

Required environment variables:

- `DOCKER_USERNAME` - Your Docker Hub username
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret (32+ characters)
- `OPENAI_API_KEY` - OpenAI API key for AI service
- Firebase configuration variables

### 3. Start All Services

```bash
# Production deployment
docker-compose up -d

# Development with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **User Appointment API**: http://localhost:8085
- **AI Service API**: http://localhost:8000
- **API Documentation**:
  - User Service: http://localhost:8085/swagger-ui.html
  - AI Service: http://localhost:8000/docs

## 🛠️ Development

### Local Development Setup

#### Frontend Development

```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:3000
```

#### User Appointment Service Development

```bash
cd user-appointment-service
mvn spring-boot:run  # Starts on http://localhost:8085
```

#### AI Service Development

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload  # Starts on http://localhost:8000
```

### Running Tests

```bash
# All services
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Individual services
cd frontend && npm test
cd user-appointment-service && ./mvnw test
cd ai-service && pytest
```

## 🏗️ Service Details

### Frontend (React + Vite + TypeScript)

- **Port**: 8080 (production), 3000 (development)
- **Framework**: React 18 with Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Authentication**: Firebase Auth
- **State Management**: Context API

### User Appointment Service (Java Spring Boot)

- **Port**: 8085
- **Framework**: Spring Boot 3.x with Java 21
- **Database**: PostgreSQL with JPA/Hibernate
- **Security**: JWT-based authentication
- **Documentation**: Swagger/OpenAPI

### AI Service (Python FastAPI)

- **Port**: 8000
- **Framework**: FastAPI with Python 3.11
- **AI Integration**: OpenAI GPT-4, LangChain
- **Documentation**: Automatic OpenAPI/Swagger

### Database (PostgreSQL)

- **Version**: PostgreSQL 15
- **Persistence**: Docker volume
- **Schema**: Auto-initialization via SQL scripts

## 🚀 Deployment

### Docker Hub + Azure VM (Automated)

The project includes GitHub Actions workflows for automated CI/CD:

1. **CI Pipeline** (`ci.yml`):

   - Tests all services
   - Builds and validates code
   - Runs integration tests

2. **CD Pipeline** (`cd.yml`):
   - Builds and pushes Docker images to Docker Hub
   - Deploys to Azure VM via SSH
   - Performs health checks

#### Required GitHub Secrets:

```bash
# Docker Hub
DOCKER_USERNAME=your_username
DOCKER_PASSWORD=your_password

# Azure VM
AZURE_SSH_HOST=your.vm.ip
AZURE_SSH_USER=your_username
AZURE_SSH_PRIVATE_KEY=your_private_key

# Application Config
DB_PASSWORD=secure_password
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key

# Firebase (all VITE_FIREBASE_* variables)
VITE_FIREBASE_API_KEY=...
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Manual Deployment

```bash
# Build all images
docker-compose build

# Push to Docker Hub
docker-compose push

# Deploy to production server
scp docker-compose.yml user@server:~/
ssh user@server "cd ~/ && docker-compose up -d"
```

## 🔧 Configuration

### Environment Variables

| Variable           | Service      | Description            |
| ------------------ | ------------ | ---------------------- |
| `DB_PASSWORD`      | All          | PostgreSQL password    |
| `JWT_SECRET`       | User Service | JWT signing secret     |
| `OPENAI_API_KEY`   | AI Service   | OpenAI API key         |
| `FIREBASE_ENABLED` | User Service | Enable Firebase auth   |
| `VITE_FIREBASE_*`  | Frontend     | Firebase configuration |

### Service URLs

Update these based on your deployment:

```bash
# Local development
FRONTEND_URL=http://localhost:8080
USER_APPOINTMENT_API_URL=http://localhost:8085
AI_SERVICE_API_URL=http://localhost:8000

# Production
FRONTEND_URL=https://your-domain.com
USER_APPOINTMENT_API_URL=https://api.your-domain.com
AI_SERVICE_API_URL=https://ai.your-domain.com
```

## 📊 Monitoring & Health Checks

All services include health check endpoints:

- **User Service**: `/actuator/health`
- **AI Service**: `/health`
- **Frontend**: `/` (returns 200 OK)
- **Database**: Built-in PostgreSQL health check

## 🔒 Security

- JWT-based authentication
- CORS configuration for cross-origin requests
- Non-root Docker containers
- Environment variable-based secrets
- Firebase Authentication integration

## 📝 API Documentation

- **User Appointment Service**: http://localhost:8085/swagger-ui.html
- **AI Service**: http://localhost:8000/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email your-email@example.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Firebase for authentication
- Spring Boot community
- React and Vite teams
