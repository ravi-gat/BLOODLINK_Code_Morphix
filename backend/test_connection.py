#!/usr/bin/env python3
"""Test PostgreSQL connection."""
import psycopg2

# Test direct psycopg2 connection
conn_params = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': 'Postgres@123',
    'database': 'bloodlink'
}

try:
    conn = psycopg2.connect(**conn_params)
    print('✅ Direct psycopg2 connection successful!')
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM "user"')
    result = cursor.fetchone()
    print(f'Users in database: {result[0]}')
    conn.close()
except Exception as e:
    print(f'❌ Connection failed: {e}')
