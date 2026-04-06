"""
Run to seed dummy data for departments, venues, clubs, and users.
"""
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import asyncio

# Allow running from project root
sys.path.insert(0, ".")

from app.config import settings
from app.models.user import User
from app.models.department import Department
from app.models.venue import Venue
from app.models.club import Club
from app.utils.security import get_password_hash

engine = create_engine(settings.DATABASE_URL_SYNC)
Session = sessionmaker(bind=engine)

def seed_data():
    with Session() as db:
        print("Seeding departments...")
        depts = [
            Department(name="MPSTME", code="MPSTME"),
            Department(name="SPTM", code="SPTM"),
            Department(name="CBE", code="CBE"),
        ]
        for d in depts:
            if not db.query(Department).filter_by(code=d.code).first():
                db.add(d)
        db.commit()

        print("Seeding venues...")
        venues = [
            Venue(name="SVKM's Main Auditorium", type="auditorium", capacity=500, active=True),
            Venue(name="Seminar Hall 1", type="seminar_hall", capacity=80, active=True),
            Venue(name="Computer Lab 4", type="lab", capacity=40, active=True),
        ]
        for v in venues:
            if not db.query(Venue).filter_by(name=v.name).first():
                db.add(v)
        db.commit()

        dept_mpstme = db.query(Department).filter_by(code="MPSTME").first()

        print("Seeding clubs...")
        clubs = [
            Club(name="Tech Club (GDSC)", description="Google Developer Student Clubs", department_id=dept_mpstme.id if dept_mpstme else None, active=True),
            Club(name="Cultural Committee", description="Organizes cultural events", department_id=None, active=True),
        ]
        for c in clubs:
            if not db.query(Club).filter_by(name=c.name).first():
                db.add(c)
        db.commit()

        print("Seeding users...")
        users = [
            User(email="admin@nmims.in", name="Super Admin", role="super_admin", status="active", is_first_login=False, hashed_password=get_password_hash("password123")),
            User(email="director@nmims.in", name="Campus Director", role="director", status="active", is_first_login=False, hashed_password=get_password_hash("password123")),
            User(email="dean@nmims.in", name="Associate Dean", role="associate_dean", department_id=dept_mpstme.id if dept_mpstme else None, status="active", is_first_login=False, hashed_password=get_password_hash("password123")),
            User(email="coord@nmims.in", name="Club Coordinator", role="club_coordinator", status="active", is_first_login=False, hashed_password=get_password_hash("password123")),
            User(email="student@nmims.in", name="Student One", role="student", status="active", is_first_login=False, hashed_password=get_password_hash("password123")),
        ]
        for u in users:
            existing = db.query(User).filter_by(email=u.email).first()
            if not existing:
                db.add(u)
            else:
                # Update password for ease of testing
                existing.hashed_password = get_password_hash("password123")
                existing.is_first_login = False
        db.commit()

        # Update coordinator's club
        coord = db.query(User).filter_by(email="coord@nmims.in").first()
        tech_club = db.query(Club).filter_by(name="Tech Club (GDSC)").first()
        if coord and tech_club:
            coord.club_id = tech_club.id
            db.commit()

        print("Dummy data seeded successfully!")

if __name__ == "__main__":
    seed_data()
