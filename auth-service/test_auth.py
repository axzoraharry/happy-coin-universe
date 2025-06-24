
#!/usr/bin/env python3
"""
Test script for the Auth Service
This tests all the main authentication endpoints
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/v1/auth"

def test_auth_service():
    print("🧪 Testing Axzora Auth Service...")
    
    # Test data
    test_user = {
        "email": "test@axzora.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    try:
        # 1. Test health check
        print("\n1️⃣ Testing health check...")
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # 2. Test user registration
        print("\n2️⃣ Testing user registration...")
        response = requests.post(f"{BASE_URL}/register", json=test_user)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ User registered: {user_data['email']}")
            user_id = user_data['id']
        else:
            print(f"❌ Registration failed: {response.text}")
            return
        
        # 3. Test user login
        print("\n3️⃣ Testing user login...")
        login_data = {"email": test_user["email"], "password": test_user["password"]}
        response = requests.post(f"{BASE_URL}/login", json=login_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            token_data = response.json()
            print(f"✅ Login successful! Token expires in: {token_data['expires_in']}s")
            access_token = token_data['access_token']
        else:
            print(f"❌ Login failed: {response.text}")
            return
        
        # 4. Test profile access
        print("\n4️⃣ Testing profile access...")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/users/{user_id}/profile", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            profile = response.json()
            print(f"✅ Profile accessed: {profile['email']}")
        else:
            print(f"❌ Profile access failed: {response.text}")
        
        # 5. Test token verification
        print("\n5️⃣ Testing token verification...")
        response = requests.get(f"{BASE_URL}/verify-token", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            verification = response.json()
            print(f"✅ Token verified for user: {verification['email']}")
        else:
            print(f"❌ Token verification failed: {response.text}")
        
        print("\n🎉 All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to auth service. Is it running?")
        print("💡 Try: docker-compose up auth-service")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_auth_service()
