
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Axzora Payment Gateway", version="1.0.0")

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
    return {"message": "Hello from Axzora Payment Gateway!", "service": "payment-gateway"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "payment-gateway"}

@app.post("/create_payment_intent")
async def create_payment_intent():
    # TODO: Implement Stripe payment intent creation
    return {"message": "Payment intent creation endpoint - implementation needed"}

@app.post("/webhook")
async def stripe_webhook():
    # TODO: Implement Stripe webhook handling
    return {"message": "Stripe webhook endpoint - implementation needed"}
