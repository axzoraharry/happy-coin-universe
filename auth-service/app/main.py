
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Axzora Auth Service", version="1.0.0")

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
    return {"message": "Hello from Axzora Auth Service!", "service": "auth"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "auth-service"}

# Authentication endpoints
@app.post("/register")
async def register_user():
    # TODO: Implement user registration
    return {"message": "User registration endpoint - implementation needed"}

@app.post("/login")
async def login_user():
    # TODO: Implement user login
    return {"message": "User login endpoint - implementation needed"}

@app.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    # TODO: Implement get user profile
    return {"message": f"User profile for {user_id} - implementation needed"}
