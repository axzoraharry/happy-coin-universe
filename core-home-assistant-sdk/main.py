import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Core Home Assistant SDK", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ServiceManager:
    def __init__(self):
        self.services = {
            "auth": "http://auth-service:8000",
            "nlu": "http://nlu-engine-service:8002", 
            "llm": "http://llm-orchestrator-service:8003",
            "happy_paisa": "http://happy-paisa-ledger:8004",
            "payments": "http://payment-gateway-service:8005",
            "mycroft": "http://mycroft-core:8181"
        }
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def call_service(self, service: str, endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Dict:
        """Call a backend service with error handling and retries"""
        if service not in self.services:
            raise HTTPException(status_code=404, detail=f"Service {service} not found")
        
        url = f"{self.services[service]}{endpoint}"
        try:
            if method.upper() == "GET":
                response = await self.client.get(url)
            elif method.upper() == "POST":
                response = await self.client.post(url, json=data)
            elif method.upper() == "PUT":
                response = await self.client.put(url, json=data)
            elif method.upper() == "DELETE":
                response = await self.client.delete(url)
            else:
                raise HTTPException(status_code=400, detail="Unsupported HTTP method")
            
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            logger.error(f"Request error calling {service}: {e}")
            return {"error": f"Service {service} unavailable", "status": "error"}
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error calling {service}: {e}")
            return {"error": f"Service {service} returned error: {e.response.status_code}", "status": "error"}

service_manager = ServiceManager()

class AssistantRequest(BaseModel):
    message: str
    context: Optional[Dict] = {}
    user_id: Optional[str] = None

class AssistantResponse(BaseModel):
    response: str
    actions: List[Dict] = []
    context: Dict = {}
    emotion: str = "neutral"
    confidence: float = 0.0

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_sessions: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_sessions[user_id] = {
            "websocket": websocket,
            "connected_at": datetime.now(),
            "last_activity": datetime.now()
        }
        logger.info(f"User {user_id} connected")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id in self.user_sessions:
            del self.user_sessions[user_id]
        logger.info(f"User {user_id} disconnected")

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.user_sessions:
            websocket = self.user_sessions[user_id]["websocket"]
            await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Connection is dead, remove it
                self.active_connections.remove(connection)

connection_manager = ConnectionManager()

class CoreAssistant:
    def __init__(self, service_manager: ServiceManager):
        self.service_manager = service_manager
        self.conversation_history = {}
    
    async def process_message(self, request: AssistantRequest) -> AssistantResponse:
        """Process user message and coordinate with backend services"""
        user_id = request.user_id or "anonymous"
        message = request.message.lower()
        
        # Initialize conversation history for user
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []
        
        # Add user message to history
        self.conversation_history[user_id].append({
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Analyze intent using NLU service
        intent_data = await self.service_manager.call_service(
            "nlu", "/v1/nlu/analyze", "POST", 
            {"text": request.message, "context": request.context}
        )
        
        # Process based on intent
        if "balance" in message or "wallet" in message:
            return await self._handle_wallet_query(request, intent_data)
        elif "transfer" in message or "send money" in message:
            return await self._handle_transfer_intent(request, intent_data)
        elif "payment" in message or "pay" in message:
            return await self._handle_payment_intent(request, intent_data)
        elif "card" in message or "virtual card" in message:
            return await self._handle_card_intent(request, intent_data)
        elif "help" in message or "what can you do" in message:
            return await self._handle_help_request(request)
        else:
            return await self._handle_general_conversation(request, intent_data)
    
    async def _handle_wallet_query(self, request: AssistantRequest, intent_data: Dict) -> AssistantResponse:
        """Handle wallet-related queries"""
        wallet_data = await self.service_manager.call_service(
            "happy_paisa", "/v1/happy-paisa/wallet/balance", "GET"
        )
        
        if wallet_data.get("status") == "error":
            return AssistantResponse(
                response="I'm having trouble accessing your wallet right now. Please try again in a moment.",
                emotion="concerned",
                confidence=0.8
            )
        
        balance = wallet_data.get("balance", 0)
        return AssistantResponse(
            response=f"Your current wallet balance is {balance} Happy Coins. Would you like to perform any transactions?",
            emotion="happy",
            confidence=0.9,
            actions=[
                {"type": "show_wallet", "data": wallet_data}
            ]
        )
    
    async def _handle_transfer_intent(self, request: AssistantRequest, intent_data: Dict) -> AssistantResponse:
        """Handle transfer requests"""
        return AssistantResponse(
            response="I can help you transfer money! To get started, I'll need the recipient's information and the amount you'd like to send. Would you like me to open the transfer form?",
            emotion="helpful",
            confidence=0.85,
            actions=[
                {"type": "open_transfer_form", "data": {}}
            ]
        )
    
    async def _handle_payment_intent(self, request: AssistantRequest, intent_data: Dict) -> AssistantResponse:
        """Handle payment requests"""
        return AssistantResponse(
            response="I can assist with payments! What would you like to pay for? I can help with bills, online purchases, or person-to-person payments.",
            emotion="helpful",
            confidence=0.85,
            actions=[
                {"type": "show_payment_options", "data": {}}
            ]
        )
    
    async def _handle_card_intent(self, request: AssistantRequest, intent_data: Dict) -> AssistantResponse:
        """Handle virtual card requests"""
        return AssistantResponse(
            response="I can help you manage your virtual cards! Would you like to create a new card, view existing cards, or check card transactions?",
            emotion="helpful",
            confidence=0.85,
            actions=[
                {"type": "show_card_management", "data": {}}
            ]
        )
    
    async def _handle_help_request(self, request: AssistantRequest) -> AssistantResponse:
        """Handle help requests"""
        return AssistantResponse(
            response="I'm Mr. Happy, your personal financial assistant! I can help you with:\n\n• Check wallet balance\n• Transfer money\n• Make payments\n• Manage virtual cards\n• View transaction history\n• Answer financial questions\n\nJust ask me anything related to your finances!",
            emotion="excited",
            confidence=1.0,
            actions=[
                {"type": "show_help_menu", "data": {}}
            ]
        )
    
    async def _handle_general_conversation(self, request: AssistantRequest, intent_data: Dict) -> AssistantResponse:
        """Handle general conversation using LLM service"""
        llm_response = await self.service_manager.call_service(
            "llm", "/v1/llm/chat", "POST",
            {
                "message": request.message,
                "context": request.context,
                "system_prompt": "You are Mr. Happy, a friendly financial assistant. Keep responses helpful, concise, and focused on financial services."
            }
        )
        
        if llm_response.get("status") == "error":
            return AssistantResponse(
                response="I'm having a small hiccup processing that. Could you try asking in a different way?",
                emotion="thinking",
                confidence=0.5
            )
        
        return AssistantResponse(
            response=llm_response.get("response", "I'm here to help with your financial needs!"),
            emotion="neutral",
            confidence=llm_response.get("confidence", 0.7)
        )

assistant = CoreAssistant(service_manager)

@app.post("/v1/assistant/chat", response_model=AssistantResponse)
async def chat_with_assistant(request: AssistantRequest):
    """Main chat endpoint for the core assistant"""
    try:
        response = await assistant.process_message(request)
        logger.info(f"Processed message from user {request.user_id}: {request.message[:50]}...")
        return response
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        return AssistantResponse(
            response="I encountered an unexpected issue. Let me try to help you in a different way.",
            emotion="concerned",
            confidence=0.3
        )

@app.websocket("/v1/assistant/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time assistant communication"""
    await connection_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            request = AssistantRequest(
                message=message_data.get("message", ""),
                context=message_data.get("context", {}),
                user_id=user_id
            )
            
            response = await assistant.process_message(request)
            await connection_manager.send_personal_message(
                json.dumps(response.dict()), user_id
            )
            
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, user_id)

@app.get("/v1/assistant/status")
async def get_assistant_status():
    """Get current assistant and service status"""
    status = {"assistant": "active", "services": {}}
    
    for service_name, service_url in service_manager.services.items():
        try:
            # Basic health check for each service
            response = await service_manager.client.get(f"{service_url}/health", timeout=5.0)
            status["services"][service_name] = "healthy" if response.status_code == 200 else "unhealthy"
        except:
            status["services"][service_name] = "unreachable"
    
    return status

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "core-home-assistant-sdk"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8006)