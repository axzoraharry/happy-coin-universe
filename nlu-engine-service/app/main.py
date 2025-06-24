
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Axzora NLU Engine", version="1.0.0")

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
    return {"message": "Hello from Axzora NLU Engine!", "service": "nlu-engine"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "nlu-engine"}

@app.post("/process")
async def process_text():
    # TODO: Implement NLU processing
    return {"message": "NLU processing endpoint - implementation needed"}
