
#!/usr/bin/env python3
"""
Test script for the Happy Paisa Ledger Service
This tests all the main wallet and transaction endpoints
"""

import requests
import json
import uuid
import time

BASE_URL = "http://localhost:8004"

def test_happy_paisa_ledger():
    print("🧪 Testing Happy Paisa Ledger Service...")
    
    # Generate test user IDs
    user1_id = str(uuid.uuid4())
    user2_id = str(uuid.uuid4())
    
    try:
        # 1. Test health check
        print("\n1️⃣ Testing health check...")
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # 2. Test wallet creation
        print(f"\n2️⃣ Testing wallet creation for user {user1_id[:8]}...")
        wallet_data = {"user_id": user1_id}
        response = requests.post(f"{BASE_URL}/api/v1/wallet", json=wallet_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            wallet = response.json()
            print(f"✅ Wallet created: Balance = {wallet['balance']}")
        else:
            print(f"❌ Wallet creation failed: {response.text}")
            return
        
        # 3. Test getting balance
        print(f"\n3️⃣ Testing balance retrieval...")
        response = requests.get(f"{BASE_URL}/api/v1/balance/{user1_id}")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            balance = response.json()
            print(f"✅ Balance retrieved: {balance['balance']} Happy Paisa")
        else:
            print(f"❌ Balance retrieval failed: {response.text}")
        
        # 4. Test adding funds
        print(f"\n4️⃣ Testing adding funds...")
        add_funds_data = {
            "user_id": user1_id,
            "amount": 100.50,
            "source": "Test payment",
            "reference_id": "test_ref_001"
        }
        response = requests.post(f"{BASE_URL}/api/v1/add-funds", json=add_funds_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Funds added: New balance = {result['balance']}")
        else:
            print(f"❌ Adding funds failed: {response.text}")
            return
        
        # 5. Test creating second wallet and transfer
        print(f"\n5️⃣ Testing wallet creation for user 2...")
        wallet_data2 = {"user_id": user2_id}
        response = requests.post(f"{BASE_URL}/api/v1/wallet", json=wallet_data2)
        print(f"Status: {response.status_code}")
        
        print(f"\n6️⃣ Testing transfer between users...")
        transfer_data = {
            "from_user_id": user1_id,
            "to_user_id": user2_id,
            "amount": 25.00,
            "description": "Test transfer",
            "reference_id": "transfer_001"
        }
        response = requests.post(f"{BASE_URL}/api/v1/transfer", json=transfer_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Transfer completed: Sender balance = {result['balance']}")
        else:
            print(f"❌ Transfer failed: {response.text}")
        
        # 6. Test getting transactions
        print(f"\n7️⃣ Testing transaction history...")
        response = requests.get(f"{BASE_URL}/api/v1/transactions/{user1_id}?limit=10")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            transactions = response.json()
            print(f"✅ Retrieved {len(transactions)} transactions")
            for tx in transactions[:3]:  # Show first 3
                print(f"   - {tx['transaction_type']}: {tx['amount']} ({tx['description']})")
        else:
            print(f"❌ Transaction retrieval failed: {response.text}")
        
        # 7. Test deducting funds
        print(f"\n8️⃣ Testing fund deduction...")
        deduct_data = {
            "user_id": user1_id,
            "amount": 10.00,
            "reason": "Service fee",
            "reference_id": "fee_001"
        }
        response = requests.post(f"{BASE_URL}/api/v1/deduct-funds", json=deduct_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Funds deducted: New balance = {result['balance']}")
        else:
            print(f"❌ Fund deduction failed: {response.text}")
        
        # 8. Final balance check
        print(f"\n9️⃣ Final balance check...")
        response = requests.get(f"{BASE_URL}/api/v1/balance/{user1_id}")
        if response.status_code == 200:
            balance = response.json()
            print(f"✅ Final balance: {balance['balance']} Happy Paisa")
            print(f"   Total earned: {balance['total_earned']}")
            print(f"   Total spent: {balance['total_spent']}")
        
        print("\n🎉 All Happy Paisa Ledger tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Happy Paisa Ledger. Is it running?")
        print("💡 Try: docker-compose up happy-paisa-ledger")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_happy_paisa_ledger()
