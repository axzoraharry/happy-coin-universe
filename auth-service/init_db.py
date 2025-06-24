
#!/usr/bin/env python3
"""
Database initialization script for the Auth Service
Run this to create tables and set up the database
"""

from app.database import create_tables, engine
from app.database import User
import sys

def init_database():
    """Initialize the database with tables"""
    try:
        print("🚀 Initializing Auth Service database...")
        create_tables()
        print("✅ Database tables created successfully!")
        
        # Test connection
        with engine.connect() as conn:
            print("✅ Database connection test successful!")
            
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
