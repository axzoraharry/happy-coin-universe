
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
import os

from . import models, auth, security
from .database import get_db, create_tables

app = FastAPI(title="Axzora Auth Service", version="1.0.0")

# CORS middleware for frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security scheme
security_scheme = HTTPBearer()

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Dependency to get current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    token_data = security.verify_token(token)
    user = auth.get_user_by_id(db, user_id=token_data["user_id"])
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

@app.get("/")
async def root():
    return {
        "message": "Hello from Axzora Auth Service!", 
        "service": "auth",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "auth-service"}

@app.post("/register", response_model=models.UserResponse)
async def register_user(user: models.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        db_user = auth.create_user(db=db, user=user)
        return db_user
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/login", response_model=models.Token)
async def login_user(user_login: models.UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    user = auth.authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email, "user_id": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": security.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@app.get("/users/{user_id}/profile", response_model=models.UserResponse)
async def get_user_profile(
    user_id: str, 
    current_user: models.UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user profile (users can only access their own profile)"""
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this profile"
        )
    
    user = auth.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@app.put("/users/{user_id}/profile", response_model=models.UserResponse)
async def update_user_profile(
    user_id: str,
    profile_update: dict,
    current_user: models.UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile"
        )
    
    try:
        updated_user = auth.update_user_profile(
            db, 
            user_id, 
            full_name=profile_update.get("full_name")
        )
        return updated_user
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )

@app.get("/verify-token")
async def verify_token(current_user: models.UserResponse = Depends(get_current_user)):
    """Verify if the current token is valid"""
    return {
        "valid": True,
        "user_id": str(current_user.id),
        "email": current_user.email
    }

@app.post("/refresh-token", response_model=models.Token)
async def refresh_token(current_user: models.UserResponse = Depends(get_current_user)):
    """Refresh the access token"""
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": current_user.email, "user_id": str(current_user.id)},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": security.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }
