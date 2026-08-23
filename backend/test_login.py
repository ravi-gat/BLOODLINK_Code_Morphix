#!/usr/bin/env python3
"""Test login endpoint."""
import requests
import json

url = 'http://localhost:8000/api/auth/login'
payload = {
    'email': 'patient@bloodlink.demo',
    'password': 'Patient@123',
    'role': 'patient'
}

response = requests.post(url, json=payload)
print(f'Status Code: {response.status_code}')

if response.status_code == 200:
    data = response.json()
    print('✅ Login successful!')
    user = data['user']
    print(f'  User: {user["name"]}')
    print(f'  Role: {user["role"]}')
    print(f'  Email: {user["email"]}')
    print(f'  City: {user["city"]}')
else:
    print('❌ Login failed')
    print(json.dumps(response.json(), indent=2))
