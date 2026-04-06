import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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

with Session() as db:
    admin = db.query(User).filter_by(email=EMAIL).first()
    if admin:
        admin.hashed_password = get_password_hash("Admin@123")
        admin.is_first_login = False
        db.commit()
        print(f"Super admin {EMAIL} updated. Password set to 'Admin@123' and is_first_login set to False.")
    else:
        print("Super admin not found. Run seed_super_admin.py first.")
