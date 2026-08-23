#!/usr/bin/env python3
"""List all tables in bloodlink database."""
import psycopg2

conn_params = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': 'Postgres@123',
    'database': 'bloodlink'
}

try:
    conn = psycopg2.connect(**conn_params)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema='public' 
        ORDER BY table_name
    """)
    
    tables = cursor.fetchall()
    print('Tables in bloodlink database:')
    for (table_name,) in tables:
        # Count rows in each table
        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        count = cursor.fetchone()[0]
        print(f'  - {table_name}: {count} rows')
    
    conn.close()
except Exception as e:
    print(f'Error: {e}')
