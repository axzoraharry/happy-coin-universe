
#!/bin/bash

echo "🛑 Stopping Axzora Mr. Happy 2.0 Backend Services..."

# Stop all services
docker-compose down

echo "✅ All backend services have been stopped."
echo ""
echo "💡 To restart: ./scripts/start-backend.sh"
echo "💡 To view logs: docker-compose logs"
echo ""
