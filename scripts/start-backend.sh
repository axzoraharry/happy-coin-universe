
#!/bin/bash

echo "🚀 Starting Axzora Mr. Happy 2.0 Backend Services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Build and start all services
echo "📦 Building and starting services..."
docker-compose up --build -d

# Wait a moment for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

echo "Testing API Gateway..."
curl -s http://localhost:8001/status > /dev/null && echo "✅ Kong API Gateway is running" || echo "❌ Kong API Gateway failed"

echo "Testing Auth Service..."
curl -s http://localhost:8000/v1/auth/health > /dev/null && echo "✅ Auth Service is running" || echo "❌ Auth Service failed"

echo "Testing NLU Service..."
curl -s http://localhost:8000/v1/nlu/health > /dev/null && echo "✅ NLU Service is running" || echo "❌ NLU Service failed"

echo "Testing LLM Service..."
curl -s http://localhost:8000/v1/llm/health > /dev/null && echo "✅ LLM Service is running" || echo "❌ LLM Service failed"

echo "Testing Happy Paisa Ledger..."
curl -s http://localhost:8000/v1/happy-paisa/health > /dev/null && echo "✅ Happy Paisa Ledger is running" || echo "❌ Happy Paisa Ledger failed"

echo "Testing Payment Gateway..."
curl -s http://localhost:8000/v1/payments/health > /dev/null && echo "✅ Payment Gateway is running" || echo "❌ Payment Gateway failed"

echo ""
echo "🎉 Backend services are starting up!"
echo ""
echo "📋 Quick Access URLs:"
echo "   Kong Admin:     http://localhost:8001/status"
echo "   API Gateway:    http://localhost:8000"
echo "   Mycroft TTS:    ws://localhost:8181"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:      docker-compose logs -f"
echo "   Stop services:  docker-compose down"
echo "   Restart:        docker-compose restart"
echo ""
