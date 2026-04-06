import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

sys.path.insert(0, ".")

from app.config import settings
from app.models.user import User
from app.models.department import Department
from app.models.club import Club
from app.models import (
    department, club, event, venue, 
    event_approval, event_registration, 
    event_report, email_notification
)
from app.utils.security import get_password_hash

engine = create_engine(settings.DATABASE_URL_SYNC)
Session = sessionmaker(bind=engine)

with Session() as db:
    # 1. Ensure a department exists
    dept = db.query(Department).filter_by(code="TEST").first()
    if not dept:
        dept = Department(name="Test Department", code="TEST")
        db.add(dept)
        db.commit()
        db.refresh(dept)
    
    # 2. Ensure a club exists under this department
    club = db.query(Club).filter_by(name="Test Club").first()
    if not club:
        club = Club(name="Test Club", description="For testing", department_id=dept.id)
        db.add(club)
        db.commit()
        db.refresh(club)

    # Helper to create/update user
    def ensure_user(email, name, role, dept_id=None, club_id=None):
        user = db.query(User).filter_by(email=email).first()
        if not user:
            user = User(
                email=email,
                name=name,
                role=role,
                status="active",
                hashed_password=get_password_hash("Test@123"),
                is_first_login=False,
                department_id=dept_id,
                club_id=club_id
            )
            db.add(user)
        else:
            user.hashed_password = get_password_hash("Test@123")
            user.is_first_login = False
            user.status = "active"
            user.role = role
            user.department_id = dept_id
            user.club_id = club_id
        db.commit()
        db.refresh(user)
        return user

    # 3. Create club_coordinator
    coordinator = ensure_user("coordinator@nmims.in", "Test Coordinator", "club_coordinator", dept.id, club.id)
    
    # 4. Create associate_dean for the same department
    adean = ensure_user("adean@nmims.in", "Test Associate Dean", "associate_dean", dept.id, None)
    
    # 5. Create director
    director = ensure_user("director@nmims.in", "Test Director", "director", None, None)

    print("Test users seeded successfully! Password for all is Test@123")
    print(f"coordinator: coordinator@nmims.in (Club: {club.id}, Dept: {dept.id})")
    print(f"associate_dean: adean@nmims.in (Dept: {dept.id})")
    print(f"director: director@nmims.in")
