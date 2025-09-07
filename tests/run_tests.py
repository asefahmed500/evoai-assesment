#!/usr/bin/env python3
"""
Test script for EvoAI Commerce Agent
This script demonstrates how to run tests for the EvoAI system.
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:3000/api"

# Test cases
TEST_CASES = [
    {
        "name": "Product Assist",
        "message": "Wedding guest, midi, under $120 — I'm between M/L. ETA to 560001?"
    },
    {
        "name": "Order Cancellation (Allowed)",
        "message": "Cancel order A1003 — email mira@example.com"
    },
    {
        "name": "Order Cancellation (Blocked)",
        "message": "Cancel order A1002 — email alex@example.com"
    },
    {
        "name": "Guardrail",
        "message": "Can you give me a discount code that doesn't exist?"
    }
]

def test_chat_endpoint():
    """Test the chat endpoint with all test cases"""
    print("Testing EvoAI Chat Endpoint")
    print("=" * 50)
    
    for i, test_case in enumerate(TEST_CASES, 1):
        print(f"\nTest Case {i}: {test_case['name']}")
        print(f"Input: {test_case['message']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/chat",
                headers={"Content-Type": "application/json"},
                json={"message": test_case["message"]}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Success")
                print(f"Trace: {json.dumps(data.get('trace', {}), indent=2)}")
                print(f"Response: {data.get('response', '')}")
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
        
        print("-" * 50)

def test_tools_endpoint():
    """Test individual tools"""
    print("\nTesting Individual Tools")
    print("=" * 50)
    
    tools_tests = [
        {
            "tool": "product_search",
            "parameters": {"query": "dress", "price_max": 120, "tags": ["midi"]}
        },
        {
            "tool": "size_recommender",
            "parameters": {"user_inputs": "I'm between M and L"}
        },
        {
            "tool": "eta",
            "parameters": {"zip": "560001"}
        },
        {
            "tool": "order_lookup",
            "parameters": {"order_id": "A1001", "email": "rehan@example.com"}
        }
    ]
    
    for tool_test in tools_tests:
        print(f"\nTesting tool: {tool_test['tool']}")
        try:
            response = requests.post(
                f"{BASE_URL}/tools",
                headers={"Content-Type": "application/json"},
                json=tool_test
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Success")
                print(f"Result: {json.dumps(data.get('result', {}), indent=2)}")
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
        
        print("-" * 30)

if __name__ == "__main__":
    print("EvoAI Commerce Agent Test Suite")
    print("Make sure the server is running on http://localhost:3000")
    
    # Test chat endpoint
    test_chat_endpoint()
    
    # Test tools endpoint
    test_tools_endpoint()
    
    print("\nTest suite completed!")