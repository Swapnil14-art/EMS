"""
Clear all row data from PostgreSQL tables while preserving schema & migrations.

Usage:
    docker exec ems_backend python clear_database_data.py
"""
import sys
from sqlalchemy import create_engine, inspect, text

sys.path.insert(0, ".")

from app.config import settings

def clear_data():
    engine = create_engine(settings.DATABASE_URL_SYNC)
    inspector = inspect(engine)
    
    # Get all actual table names in current PostgreSQL public schema
    all_tables = inspector.get_table_names(schema="public")
    
    # Exclude alembic_version table
    data_tables = [t for t in all_tables if t != "alembic_version"]
    
    print(f"🗑️ Found {len(data_tables)} data tables to clear: {', '.join(data_tables)}")
    
    with engine.connect() as conn:
        for table in data_tables:
            try:
                # Truncate each table with CASCADE and RESTART IDENTITY
                conn.execute(text(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;'))
                conn.commit()
                print(f"  ✓ Cleared table: {table}")
            except Exception as e:
                print(f"  ⚠️ Error clearing {table}: {e}")
                
    print("\n✨ Database successfully cleared! All table schemas and Alembic migration history are intact.")

if __name__ == "__main__":
    clear_data()
