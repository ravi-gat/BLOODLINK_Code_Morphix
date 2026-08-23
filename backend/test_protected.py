#!/usr/bin/env python3
"""Test protected endpoints."""
import requests
import json

# First, login to get token
login_url = 'http://localhost:8000/api/auth/login'
login_payload = {
    'email': 'patient@bloodlink.demo',
    'password': 'Patient@123',
    'role': 'patient'
}

response = requests.post(login_url, json=login_payload)
if response.status_code != 200:
    print('Login failed')
    exit(1)

# Get the access token from response
data = response.json()
token = data['access_token']
print(f'✅ Got access token')

# Test /me endpoint
headers = {'Authorization': f'Bearer {token}'}
me_url = 'http://localhost:8000/api/auth/me'
response = requests.get(me_url, headers=headers)

print(f'\n✅ /api/auth/me endpoint works!')
print(f'   Status: {response.status_code}')

if response.status_code == 200:
    me_data = response.json()
    print(f'   User: {me_data["name"]}')
    print(f'   Email: {me_data["email"]}')
    print(f'   Role: {me_data["role"]}')
