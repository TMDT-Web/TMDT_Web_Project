#!/usr/bin/env python3
"""
Script to test API endpoints
"""
import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

async def test_health():
    """Test health endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/v1/health")
        print(f"Health check: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200

async def test_root():
    """Test root endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/")
        print(f"Root endpoint: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200

async def test_register():
    """Test user registration"""
    async with httpx.AsyncClient() as client:
        user_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "full_name": "Test User",
            "phone": "+84901234567"
        }
        
        response = await client.post(
            f"{BASE_URL}/api/v1/auth/register",
            json=user_data
        )
        print(f"Register: {response.status_code}")
        if response.status_code == 201:
            print(f"User created: {response.json()}")
            return response.json()
        else:
            print(f"Error: {response.text}")
            return None

async def test_login():
    """Test user login"""
    async with httpx.AsyncClient() as client:
        login_data = {
            "username": "test@example.com",
            "password": "testpassword123"
        }
        
        response = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            data=login_data
        )
        print(f"Login: {response.status_code}")
        if response.status_code == 200:
            token_data = response.json()
            print(f"Token: {token_data['access_token'][:20]}...")
            return token_data['access_token']
        else:
            print(f"Error: {response.text}")
            return None

async def test_me(token: str):
    """Test get current user"""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get(
            f"{BASE_URL}/api/v1/auth/me",
            headers=headers
        )
        print(f"Get me: {response.status_code}")
        if response.status_code == 200:
            print(f"User data: {response.json()}")
            return response.json()
        else:
            print(f"Error: {response.text}")
            return None

async def test_categories():
    """Test get categories"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/v1/catalog/categories")
        print(f"Categories: {response.status_code}")
        if response.status_code == 200:
            print(f"Categories: {response.json()}")
            return response.json()
        else:
            print(f"Error: {response.text}")
            return None

async def test_listings():
    """Test get listings"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/v1/catalog/listings")
        print(f"Listings: {response.status_code}")
        if response.status_code == 200:
            print(f"Listings: {response.json()}")
            return response.json()
        else:
            print(f"Error: {response.text}")
            return None

async def main():
    """Run all tests"""
    print("🚀 Testing C2C Marketplace API")
    print("=" * 50)
    
    # Test basic endpoints
    print("\n1. Testing basic endpoints...")
    await test_root()
    await test_health()
    
    # Test auth flow
    print("\n2. Testing authentication flow...")
    user = await test_register()
    if user:
        token = await test_login()
        if token:
            await test_me(token)
    
    # Test catalog endpoints
    print("\n3. Testing catalog endpoints...")
    await test_categories()
    await test_listings()
    
    print("\n✅ API testing completed!")

if __name__ == "__main__":
    asyncio.run(main())
