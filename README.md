
# Axzora "Mr. Happy 2.0" Ecosystem

Welcome to the complete development environment for Axzora's Mr. Happy 2.0 - an AI-powered digital assistant with emotional intelligence and financial capabilities.

## 🌟 What is Mr. Happy 2.0?

Mr. Happy 2.0 is an advanced AI companion that:
- Understands and responds to emotions
- Manages your Happy Paisa (₹1000 digital currency)
- Provides travel booking, recharging, and e-commerce services
- Integrates with your development workflow via Git
- Speaks with natural, expressive voice synthesis

## 🚀 Quick Start

### Prerequisites
Make sure you have installed:
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js](https://nodejs.org/)
- [Python 3.9+](https://www.python.org/)
- [Go 1.20+](https://go.dev/)

### 1. Clone and Setup
```bash
git clone [your-repo-url]
cd axzora-mrhappy-ecosystem
```

### 2. Start Backend Services
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start all backend services
./scripts/start-backend.sh
```

### 3. Verify Services
Open these URLs to verify everything is running:
- Kong Admin: http://localhost:8001/status
- API Gateway: http://localhost:8000
- Auth Service: http://localhost:8000/v1/auth/health

## 📁 Project Structure

```
axzora-mrhappy-ecosystem/
├── 📄 docker-compose.yml          # Main orchestration file
├── 🗂️ api-gateway/               # Kong API Gateway config
├── 🔐 auth-service/               # User authentication
├── 🧠 nlu-engine-service/         # Natural Language Understanding
├── 🤖 llm-orchestrator-service/   # Large Language Model management
├── 💰 happy-paisa-ledger/         # Digital currency system
├── 💳 payment-gateway-service/    # Stripe payment integration
├── 🎙️ mycroft-core/              # Voice AI (Mr. Happy's brain)
├── 🌐 frontend-configs/           # Frontend environment templates
├── 📜 scripts/                   # Utility scripts
└── 📖 SETUP_GUIDE.md             # Detailed setup instructions
```

## 🔧 Development Commands

```bash
# View service logs
docker-compose logs -f

# Restart a specific service
docker-compose restart auth-service

# Stop all services
./scripts/stop-backend.sh

# Check service status
docker-compose ps
```

## 🌐 API Endpoints

### Authentication
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `GET /v1/users/{user_id}/profile` - User profile

### AI Processing
- `POST /v1/nlu/process` - Natural language understanding
- `POST /v1/llm/generate` - AI response generation
- `POST /v1/llm/rag_query` - Knowledge-based queries

### Happy Paisa Wallet
- `GET /v1/happy-paisa/balance/{user_id}` - Get wallet balance
- `POST /v1/happy-paisa/transfer` - Transfer Happy Paisa
- `POST /v1/payments/create_payment_intent` - Create payment

### Voice Streaming
- `ws://localhost:8181/tts_stream` - Mr. Happy's voice stream

## 🎯 Next Steps

1. **Implement Service Logic**: Add business logic to each microservice
2. **Build Frontend Applications**: Create web and mobile interfaces
3. **Develop Mycroft Skills**: Build custom AI capabilities
4. **Add More Services**: Implement travel, recharge, e-commerce
5. **Security & Testing**: Add authentication, validation, tests
6. **Deploy**: Set up CI/CD and production deployment

## 📚 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Mycroft AI Documentation](https://mycroft-ai.gitbook.io/docs/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [Kong Gateway Docs](https://docs.konghq.com/)
- [Go Programming Guide](https://go.dev/doc/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with Docker Compose
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy coding with Mr. Happy 2.0! 🚀**
