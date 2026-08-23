#!/usr/bin/env python3
"""Setup PostgreSQL database for BloodLink"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

try:
    # Connect to PostgreSQL server (default postgres database)
    conn = psycopg2.connect(
        host="localhost",
        user="postgres",
        password="Postgres@123",
        port=5432,
        database="postgres"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if bloodlink database exists
    cursor.execute("SELECT datname FROM pg_database WHERE datname='bloodlink';")
    result = cursor.fetchone()
    
    if result:
        print("✓ Database 'bloodlink' already exists")
    else:
        print("✗ Database 'bloodlink' does not exist, creating...")
        cursor.execute("CREATE DATABASE bloodlink;")
        print("✓ Database 'bloodlink' created successfully")
    
    cursor.close()
    conn.close()
    print("✓ Database setup complete!")
    sys.exit(0)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
