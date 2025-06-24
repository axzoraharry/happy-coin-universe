
# Axzora "Mr. Happy 2.0" Ecosystem - Complete Setup Guide

## 🎯 Goal
Set up a complete development environment for Axzora's Mr. Happy 2.0 with backend microservices, AI integration, and frontend connectivity - all running locally with Docker Compose for easy "auto-deploy."

## 📋 Prerequisites (Your Coding Toolbox)

### 1. Git - Code Version Control
- **Install**: [Git Installation Guide](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- **Verify**: Open Terminal/Command Prompt and run:
  ```bash
  git --version
  ```

### 2. Docker Desktop - Container Management
- **Install**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Verify**: 
  ```bash
  docker --version
  docker-compose --version
  ```

### 3. Node.js & npm - Frontend Development
- **Install**: [Node.js LTS](https://nodejs.org/en/download)
- **Verify**: 
  ```bash
  node -v
  npm -v
  ```

### 4. Python 3.9+ - Backend Services
- **Install**: [Python Downloads](https://www.python.org/downloads/)
- **Note**: Check "Add Python to PATH" during Windows installation
- **Verify**: 
  ```bash
  python3 --version
  # or on Windows:
  python --version
  ```

### 5. Go 1.20+ - High-Performance Services
- **Install**: [Go Installation](https://go.dev/doc/install)
- **Verify**: 
  ```bash
  go version
  ```

### 6. Code Editor
- **Recommended**: [Visual Studio Code](https://code.visualstudio.com/)
- **Extensions**: Python, Go, JavaScript/TypeScript, Docker

## 🏗️ Project Structure

```
axzora-mrhappy-ecosystem/
├── docker-compose.yml
├── api-gateway/
│   └── kong.yml
├── auth-service/
├── nlu-engine-service/
├── llm-orchestrator-service/
├── happy-paisa-ledger/
├── payment-gateway-service/
├── mycroft-core/
├── axzora-webapp/
└── axzora-mobile-app/
```

## 🚀 Step 1: Initial Setup

### 1.1 Create Main Project Directory
```bash
# Navigate to your projects folder
cd Documents/CodingProjects  # or wherever you keep code

# Create main project folder
mkdir axzora-mrhappy-ecosystem
cd axzora-mrhappy-ecosystem
```

## 🐳 Step 2: Backend Services (Docker Compose)

### 2.1 Create docker-compose.yml
This is your "auto-deploy" configuration file:

```yaml
version: '3.8'

services:
  # --- API Gateway (Kong) ---
  api-gateway:
    image: kong:3.4
    hostname: api-gateway
    ports:
      - "8000:8000"  # HTTP API
      - "8443:8443"  # HTTPS API
      - "8001:8001"  # Admin API
      - "8444:8444"  # Admin HTTPS
    environment:
      KONG_DATABASE: "postgres"
      KONG_PG_HOST: "kong-db"
      KONG_PG_USER: "kong"
      KONG_PG_PASSWORD: "kong_password"
      KONG_PROXY_ACCESS_LOG: "/dev/stdout"
      KONG_ADMIN_ACCESS_LOG: "/dev/stdout"
      KONG_PROXY_ERROR_LOG: "/dev/stderr"
      KONG_ADMIN_ERROR_LOG: "/dev/stderr"
      KONG_ADMIN_LISTEN: "0.0.0.0:8001,0.0.0.0:8444 ssl"
      KONG_DECLARATIVE_CONFIG: /etc/kong/kong.yml
    volumes:
      - ./api-gateway/kong.yml:/etc/kong/kong.yml
    depends_on:
      - kong-db
    networks:
      - axzora-network

  kong-db:
    image: postgres:13
    hostname: kong-db
    environment:
      POSTGRES_DB: "kong"
      POSTGRES_USER: "kong"
      POSTGRES_PASSWORD: "kong_password"
    volumes:
      - kong_data:/var/lib/postgresql/data
    networks:
      - axzora-network

  # --- Authentication Service ---
  auth-service:
    build: ./auth-service
    hostname: auth-service
    environment:
      DATABASE_URL: "postgresql://auth_user:auth_password@auth-db:5432/auth_db"
      JWT_SECRET_KEY: "your_super_secret_jwt_key_change_me_in_prod"
    depends_on:
      - auth-db
    networks:
      - axzora-network

  auth-db:
    image: postgres:13
    hostname: auth-db
    environment:
      POSTGRES_DB: "auth_db"
      POSTGRES_USER: "auth_user"
      POSTGRES_PASSWORD: "auth_password"
    volumes:
      - auth_data:/var/lib/postgresql/data
    networks:
      - axzora-network

  # --- NLU Engine Service ---
  nlu-engine-service:
    build: ./nlu-engine-service
    hostname: nlu-engine-service
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
    networks:
      - axzora-network

  # --- LLM Orchestrator Service ---
  llm-orchestrator-service:
    build: ./llm-orchestrator-service
    hostname: llm-orchestrator-service
    environment:
      OPENAI_API_KEY: "sk-your_openai_key_here"
      LLM_PROVIDER: "openai"
    networks:
      - axzora-network

  # --- Happy Paisa Ledger ---
  happy-paisa-ledger:
    build: ./happy-paisa-ledger
    hostname: happy-paisa-ledger
    environment:
      DATABASE_URL: "postgresql://hp_user:hp_password@hp-db:5432/hp_db"
    depends_on:
      - hp-db
    networks:
      - axzora-network

  hp-db:
    image: postgres:13
    hostname: hp-db
    environment:
      POSTGRES_DB: "hp_db"
      POSTGRES_USER: "hp_user"
      POSTGRES_PASSWORD: "hp_password"
    volumes:
      - hp_data:/var/lib/postgresql/data
    networks:
      - axzora-network

  # --- Payment Gateway Service ---
  payment-gateway-service:
    build: ./payment-gateway-service
    hostname: payment-gateway-service
    environment:
      STRIPE_SECRET_KEY: "sk_test_your_stripe_secret_key_here"
      STRIPE_WEBHOOK_SECRET: "whsec_your_webhook_secret_here"
      HAPPY_PAISA_LEDGER_API_URL: "http://happy-paisa-ledger:8004"
    networks:
      - axzora-network

  # --- Mycroft Core (AI Brain) ---
  mycroft-core:
    build: ./mycroft-core
    hostname: mycroft-core
    environment:
      AXZORA_API_GATEWAY_URL: "http://api-gateway:8000"
      MYCROFT_TTS_STREAM_PORT: "8181"
    ports:
      - "8181:8181"  # TTS streaming port
    networks:
      - axzora-network

networks:
  axzora-network:
    driver: bridge

volumes:
  kong_data:
  auth_data:
  hp_data:
```

### 2.2 API Gateway Configuration

Create `api-gateway/kong.yml`:

```yaml
_format_version: "3.0"

services:
  - name: auth-service-internal
    url: http://auth-service:8000
    routes:
      - name: auth-route
        paths: ["/v1/auth", "/v1/users"]
        strip_path: false

  - name: nlu-engine-service-internal
    url: http://nlu-engine-service:8002
    routes:
      - name: nlu-route
        paths: ["/v1/nlu"]
        strip_path: false

  - name: llm-orchestrator-service-internal
    url: http://llm-orchestrator-service:8003
    routes:
      - name: llm-route
        paths: ["/v1/llm"]
        strip_path: false

  - name: happy-paisa-ledger-internal
    url: http://happy-paisa-ledger:8004
    routes:
      - name: happy-paisa-route
        paths: ["/v1/happy-paisa"]
        strip_path: false

  - name: payment-gateway-service-internal
    url: http://payment-gateway-service:8005
    routes:
      - name: payment-route
        paths: ["/v1/payments"]
        strip_path: false

  - name: mycroft-api-proxy-internal
    url: http://mycroft-core:8181
    routes:
      - name: mycroft-api-route
        paths: ["/v1/mycroft"]
        strip_path: false
```

## 🔧 Step 3: Service Implementation Templates

### 3.1 Python Services (Auth, NLU, LLM, Payment)

For each Python service folder, create these files:

**Dockerfile** (same for all Python services):
```dockerfile
FROM python:3.10-slim-buster

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**requirements.txt**:
```txt
fastapi==0.104.1
uvicorn[standard]==0.23.2
psycopg2-binary==2.9.7
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.4.2
sqlalchemy==2.0.21
alembic==1.12.0
```

**app/main.py** (starter template):
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Axzora Service", version="1.0.0")

# CORS middleware for frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello from Axzora Service!", "service": "template"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "healthy"}

# Add your specific service endpoints here
```

### 3.2 Go Service (Happy Paisa Ledger)

**Dockerfile**:
```dockerfile
FROM golang:1.20-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
CMD ["./main"]
```

**main.go**:
```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "github.com/gorilla/mux"
)

type HealthResponse struct {
    Status  string `json:"status"`
    Service string `json:"service"`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    response := HealthResponse{
        Status:  "ok",
        Service: "happy-paisa-ledger",
    }
    json.NewEncoder(w).Encode(response)
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    response := map[string]string{
        "message": "Hello from Happy Paisa Ledger!",
        "service": "happy-paisa-ledger",
    }
    json.NewEncoder(w).Encode(response)
}

func main() {
    r := mux.NewRouter()
    
    // Basic routes
    r.HandleFunc("/", rootHandler).Methods("GET")
    r.HandleFunc("/health", healthHandler).Methods("GET")
    
    // Add your Happy Paisa specific endpoints here
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "8004"
    }
    
    fmt.Printf("Happy Paisa Ledger server starting on port %s\n", port)
    log.Fatal(http.ListenAndServe(":"+port, r))
}
```

**go.mod**:
```go
module happy-paisa-ledger

go 1.20

require (
    github.com/gorilla/mux v1.8.0
    github.com/lib/pq v1.10.9
)
```

### 3.3 Mycroft Core Service

**Dockerfile**:
```dockerfile
FROM ubuntu:22.04

ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    git python3 python3-pip python3-venv \
    curl libffi-dev libssl-dev portaudio19-dev \
    espeak-ng build-essential pkg-config \
    jq pulseaudio-utils sox alsa-utils libatlas-base-dev \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/mycroft

# Clone Mycroft Core
RUN git clone https://github.com/MycroftAI/mycroft-core.git .

# Install Mycroft dependencies
RUN python3 -m pip install -r requirements.txt --break-system-packages

# Expose TTS streaming port
EXPOSE 8181

# Start Mycroft services
CMD ["bash", "start.sh", "all"]
```

## 🚀 Step 4: Deploy Your Backend

### 4.1 Build and Start Services

```bash
# From your main project directory
cd axzora-mrhappy-ecosystem

# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4.2 Test Your API Gateway

Open these URLs in your browser:

- Kong Admin: http://localhost:8001/status
- Auth Service: http://localhost:8000/v1/auth/health
- NLU Service: http://localhost:8000/v1/nlu/health
- LLM Service: http://localhost:8000/v1/llm/health
- Happy Paisa: http://localhost:8000/v1/happy-paisa/health
- Payment Service: http://localhost:8000/v1/payments/health

## 🌐 Step 5: Frontend Applications

### 5.1 Web Application Setup

Create `.env.local` in your web app folder:
```env
NEXT_PUBLIC_AXZORA_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_MYCROFT_TTS_WEBSOCKET_URL=ws://localhost:8181/tts_stream
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
```

### 5.2 Mobile Application Setup

Create `.env` in your mobile app folder:
```env
# For Android Emulator
AXZORA_API_BASE_URL=http://10.0.2.2:8000

# For iOS Simulator or Physical Device (replace with your IP)
# AXZORA_API_BASE_URL=http://192.168.1.5:8000

MYCROFT_TTS_WEBSOCKET_URL=ws://YOUR_LOCAL_IP:8181/tts_stream
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
```

## 📡 Step 6: Core API Endpoints

Your frontend applications will use these endpoints:

### Authentication
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `GET /v1/users/{user_id}/profile` - Get user profile

### AI Processing
- `POST /v1/nlu/process` - Natural language understanding
- `POST /v1/llm/generate` - Generate AI responses
- `POST /v1/llm/rag_query` - RAG-based queries

### Happy Paisa Wallet
- `GET /v1/happy-paisa/balance/{user_id}` - Get wallet balance
- `POST /v1/happy-paisa/transfer` - Transfer Happy Paisa
- `POST /v1/payments/create_payment_intent` - Create payment

### Voice Streaming
- `ws://localhost:8181/tts_stream` - Mr. Happy's voice stream

## 🔗 Open Source Resources

- **Mycroft AI**: [GitHub](https://github.com/MycroftAI/mycroft-core)
- **Docker**: [Official Site](https://www.docker.com/)
- **Kong Gateway**: [GitHub](https://github.com/Kong/kong)
- **FastAPI**: [Official Site](https://fastapi.tiangolo.com/)
- **Next.js**: [Official Site](https://nextjs.org/)
- **React Native**: [Official Site](https://reactnative.dev/)

## 🎯 Next Steps

1. **Fill in Service Logic**: Implement actual business logic in each service
2. **Build Frontend**: Create your web and mobile interfaces
3. **Create Mycroft Skills**: Build custom AI skills for Mr. Happy
4. **Add More Services**: Implement travel, recharge, e-commerce services
5. **Security**: Add proper authentication, rate limiting, and validation
6. **Testing**: Add unit tests and integration tests
7. **Production**: Set up CI/CD with GitHub Actions and Kubernetes

## 💡 Tips for New Coders

1. Start with one service at a time
2. Use the health endpoints to verify connectivity
3. Check Docker logs when services don't start: `docker-compose logs [service-name]`
4. Use Postman or curl to test API endpoints
5. Keep learning with official documentation and online tutorials

Happy coding! 🚀
