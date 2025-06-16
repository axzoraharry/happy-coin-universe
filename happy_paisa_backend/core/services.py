from config.settings import HAPPY_PAISA_TO_INR_EXCHANGE_RATE

# In-memory database for user balances
user_balances = {}

def award_happy_paisa(user_id: str, amount: float) -> dict:
    """Awards Happy Paisa tokens to a user."""
    if amount <= 0:
        return {'success': False, 'message': 'Amount must be positive'}

    user_balances[user_id] = user_balances.get(user_id, 0.0) + amount
    # Returning only new HP balance as per original function, not INR.
    # The get_balance endpoint is for viewing both.
    return {'success': True, 'user_id': user_id, 'new_balance': user_balances[user_id]}

def deduct_happy_paisa(user_id: str, amount: float) -> dict:
    """Deducts Happy Paisa tokens from a user."""
    if amount <= 0:
        return {'success': False, 'message': 'Amount must be positive'}

    if user_id not in user_balances or user_balances[user_id] < amount:
        return {'success': False, 'message': 'Insufficient funds or user not found'}

    user_balances[user_id] -= amount
    # Returning only new HP balance as per original function.
    return {'success': True, 'user_id': user_id, 'new_balance': user_balances[user_id]}

def convert_happy_paisa_to_inr(hp_amount: float) -> float:
    return hp_amount * HAPPY_PAISA_TO_INR_EXCHANGE_RATE

def convert_inr_to_happy_paisa(inr_amount: float) -> float:
    if HAPPY_PAISA_TO_INR_EXCHANGE_RATE == 0: # Avoid division by zero
        return 0.0
    return inr_amount / HAPPY_PAISA_TO_INR_EXCHANGE_RATE

def get_balance(user_id: str) -> dict:
    """Gets the Happy Paisa token balance for a user, including INR equivalent."""
    hp_balance = user_balances.get(user_id, 0.0)
    inr_equivalent = convert_happy_paisa_to_inr(hp_balance)
    return {
        'success': True,
        'user_id': user_id,
        'happy_paisa_balance': hp_balance,
        'inr_equivalent': inr_equivalent
    }
