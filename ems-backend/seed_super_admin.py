"""
Run once to create the first super_admin user.

Usage:
    docker exec ems_backend python seed_super_admin.py
    or
    python seed_super_admin.py  (locally with DATABASE_URL_SYNC set)
"""
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Allow running from project root
sys.path.insert(0, ".")

from app.config import settings
from app.models.user import User
from app.models import (
    department, club, event, venue, 
    event_approval, event_registration, 
    event_report, email_notification
)
from app.utils.security import get_password_hash

engine = create_engine(settings.DATABASE_URL_SYNC)
Session = sessionmaker(bind=engine)

EMAIL = "admin@nmims.in"
NAME = "Super Admin"
PASSWORD = "Admin@123"

with Session() as db:
    existing = db.query(User).filter_by(email=EMAIL).first()
    if existing:
        print(f"Super admin already exists: {EMAIL}")
        # Automatically fix the hashed password if it's missing or old
        existing.hashed_password = get_password_hash(PASSWORD)
        existing.is_first_login = False
        db.commit()
        print(f"Super admin password reset to {PASSWORD}")
    else:
        admin = User(
            email=EMAIL,
            name=NAME,
            hashed_password=get_password_hash(PASSWORD),
            is_first_login=False,
            role="super_admin",
            status="active",
        )
        db.add(admin)
        db.commit()
        print(f"Super admin created: {EMAIL} with password {PASSWORD}")
