from fastapi import FastAPI, HTTPException
from pydantic import BaseModel # BaseModel is already imported, ensuring it's here.
from typing import Dict

# Assuming services.py is in core directory relative to app directory's parent
# Adjust import path if necessary based on actual execution context or by adding to sys.path
# For now, let's assume a structure where happy_paisa_backend is the root for python path
from core import services # This will require happy_paisa_backend to be in PYTHONPATH

app = FastAPI(title="Happy Paisa Backend")

class TransactionRequest(BaseModel):
    user_id: str
    amount: float

class BalanceResponse(BaseModel):
    success: bool
    user_id: str
    happy_paisa_balance: float
    inr_equivalent: float

@app.post("/award", response_model=Dict) # Kept as Dict as service returns {'success': True, 'user_id': user_id, 'new_balance': user_balances[user_id]}
async def award_endpoint(request: TransactionRequest):
    result = services.award_happy_paisa(request.user_id, request.amount)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    return result

@app.post("/deduct", response_model=Dict) # Kept as Dict as service returns {'success': True, 'user_id': user_id, 'new_balance': user_balances[user_id]}
async def deduct_endpoint(request: TransactionRequest):
    result = services.deduct_happy_paisa(request.user_id, request.amount)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    return result

@app.get("/balance/{user_id}", response_model=BalanceResponse) # Updated response_model
async def balance_endpoint(user_id: str):
    result = services.get_balance(user_id)
    # get_balance now returns the structure matching BalanceResponse
    return result

# Placeholder for running with uvicorn if main.py is executed directly
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
