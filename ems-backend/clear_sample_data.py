"""
Clear only sample event and transactional data from PostgreSQL while keeping users, roles, departments, venues, and clubs intact.

Usage:
    docker exec ems_backend python clear_sample_data.py
    or
    python clear_sample_data.py (locally with virtual environment active)
"""
import sys
from sqlalchemy import create_engine, text

sys.path.insert(0, ".")

from app.config import settings

def clear_sample_data():
    engine = create_engine(settings.DATABASE_URL_SYNC)
    
    # List of tables to clear (transactional and event-related data)
    tables_to_clear = [
        "event_registrations",
        "event_approvals",
        "event_reports",
        "event_rnd_reports",
        "event_documents",
        "event_other_docs",
        "event_links",
        "event_coordinators",
        "event_edit_history",
        "event_venues",
        "event_collaborating_clubs",
        "event_sponsors",
        "events",
        "email_notifications"
    ]
    
    print(f"🗑️ Clearing event transactional data. Clearing {len(tables_to_clear)} tables...")
    
    with engine.connect() as conn:
        for table in tables_to_clear:
            try:
                # Truncate each table with CASCADE and RESTART IDENTITY
                conn.execute(text(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;'))
                conn.commit()
                print(f"  ✓ Cleared table: {table}")
            except Exception as e:
                print(f"  ⚠️ Could not clear {table}: {e}")
                
    print("\n✨ Event sample data cleared successfully! Users, roles, departments, venues, and clubs are preserved.")

if __name__ == "__main__":
    clear_sample_data()
