"""
Seed script for the complete EMS test matrix: reference data, users, and event scenarios.

Usage (Docker — recommended):
    docker exec ems_backend python seed_all_test_data.py

Usage (local, if DATABASE_URL_SYNC points to your DB):
    cd ems-backend
    python seed_all_test_data.py

Idempotent: safe to re-run. Existing records are skipped; user passwords are
always reset to the default so you can log in immediately after running.

Default password for ALL seeded users:  Test@123
"""
import sys

sys.path.insert(0, ".")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.user import User
from app.models.department import Department
from app.models.venue import Venue
from app.models.club import Club

# Import all models so relationship look-ups resolve
from app.models import (  # noqa: F401
    department, club, event, venue,
    event_approval, event_registration,
    event_report, email_notification
)
from app.utils.security import get_password_hash

DEFAULT_PASSWORD = "Test@123"

engine = create_engine(settings.DATABASE_URL_SYNC)
Session = sessionmaker(bind=engine)


# ── helpers ─────────────────────────────────────────────────────────────────

def upsert_department(db, name: str, code: str) -> Department:
    """Create a department if it doesn't exist; return it either way."""
    dept = db.query(Department).filter_by(code=code).first()
    if not dept:
        dept = Department(name=name, code=code)
        db.add(dept)
        db.flush()  # get the id immediately
        print(f"  + Department: {name} ({code})")
    else:
        print(f"  · Department already exists: {name} ({code})")
    return dept


def upsert_venue(db, *, name: str, location: str, max_capacity: int,
                 aliases: str = None, department_id: int = None) -> Venue:
    existing = db.query(Venue).filter_by(name=name).first()
    if not existing:
        v = Venue(
            name=name,
            location=location,
            max_capacity=max_capacity,
            aliases=aliases,
            department_id=department_id,
            is_active=True,
        )
        db.add(v)
        db.flush()
        print(f"  + Venue: {name}")
        return v
    print(f"  · Venue already exists: {name}")
    return existing


def upsert_club(db, *, name: str, description: str,
                department_id: int, level: str = "department") -> Club:
    existing = db.query(Club).filter_by(name=name).first()
    if not existing:
        c = Club(
            name=name,
            description=description,
            department_id=department_id,
            level=level,
            is_active=True,
        )
        db.add(c)
        db.flush()
        print(f"  + Club: {name} (level: {level})")
        return c
    print(f"  · Club already exists: {name}")
    return existing


def upsert_user(db, *, email: str, name: str, role: str,
                password: str = DEFAULT_PASSWORD,
                department_id: int = None, club_id: int = None,
                extra_permissions: list[str] | None = None,
                coordinator_type: str | None = None,
                sap_id: str | None = None, branch: str | None = None,
                course: str | None = None, year_of_study: str | None = None,
                phone_number: str | None = None) -> User:
    user = db.query(User).filter_by(email=email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            role=role,
            status="active",
            hashed_password=get_password_hash(password),
            is_first_login=False,
            department_id=department_id,
            club_id=club_id,
            extra_permissions=extra_permissions or [],
            coordinator_type=coordinator_type,
            sap_id=sap_id,
            branch=branch,
            course=course,
            year_of_study=year_of_study,
            phone_number=phone_number,
        )
        db.add(user)
        db.flush()
        print(f"  + User: {name} <{email}>  role={role}")
    else:
        # Always reset password & activate so the account is usable
        user.hashed_password = get_password_hash(password)
        user.is_first_login = False
        user.status = "active"
        user.role = role
        user.department_id = department_id
        user.club_id = club_id
        user.extra_permissions = extra_permissions or []
        user.coordinator_type = coordinator_type
        user.sap_id = sap_id
        user.branch = branch
        user.course = course
        user.year_of_study = year_of_study
        user.phone_number = phone_number
        print(f"  · User already exists (updated): {name} <{email}>  role={role}")
    return user


# ── main seed logic ─────────────────────────────────────────────────────────

def seed(include_events: bool = True):
    with Session() as db:

        # ────────────────────────────────────────────────────────────────────
        # 1. DEPARTMENTS
        # ────────────────────────────────────────────────────────────────────
        print("\n📁 Departments")
        dept_engg = upsert_department(db, "Engineering", "ENGG")
        dept_agri = upsert_department(db, "Agriculture", "AGRI")
        dept_phrm = upsert_department(db, "Pharmacy", "PHRM")
        db.commit()

        # ────────────────────────────────────────────────────────────────────
        # 2. VENUES
        # ────────────────────────────────────────────────────────────────────
        print("\n🏛️  Venues")
        upsert_venue(db, name="Main Auditorium",
                     location="Central Block, Ground Floor",
                     max_capacity=3, aliases="auditorium,main hall")
        upsert_venue(db, name="Seminar Hall A",
                     location="Engineering Block, 1st Floor",
                     max_capacity=1, aliases="seminar A,sem hall A",
                     department_id=dept_engg.id)
        upsert_venue(db, name="Seminar Hall B",
                     location="Agriculture Block, 2nd Floor",
                     max_capacity=1, aliases="seminar B,sem hall B",
                     department_id=dept_agri.id)
        upsert_venue(db, name="Open Air Theatre",
                     location="Behind Library",
                     max_capacity=2, aliases="OAT,open air")
        upsert_venue(db, name="Computer Lab 1",
                     location="Engineering Block, 3rd Floor",
                     max_capacity=1, aliases="comp lab 1,lab 1",
                     department_id=dept_engg.id)
        upsert_venue(db, name="Conference Room",
                     location="Admin Block, 2nd Floor",
                     max_capacity=1, aliases="conf room,meeting room")
        upsert_venue(db, name="Sports Ground",
                     location="Campus East Wing",
                     max_capacity=2, aliases="ground,playground")
        upsert_venue(db, name="Pharmacy Lab",
                     location="Pharmacy Block, Ground Floor",
                     max_capacity=1, aliases="pharma lab",
                     department_id=dept_phrm.id)
        db.commit()

        # ────────────────────────────────────────────────────────────────────
        # 3. CLUBS  (spread across departments)
        # ────────────────────────────────────────────────────────────────────
        print("\n🎭 Clubs")
        club_gdsc = upsert_club(
            db, name="Google DSC",
            description="Google Developer Student Clubs — workshops, hackathons and tech talks",
            department_id=dept_engg.id)
        club_robo = upsert_club(
            db, name="Robotics Club",
            description="Build, program and compete with robots",
            department_id=dept_engg.id)
        club_agri_innov = upsert_club(
            db, name="AgriInnovate",
            description="Sustainable agriculture research and awareness drives",
            department_id=dept_agri.id)
        club_green = upsert_club(
            db, name="Green Earth Society",
            description="Environmental campaigns, tree-planting and eco-events",
            department_id=dept_agri.id)
        club_pharma = upsert_club(
            db, name="PharmaCare Club",
            description="Health camps, drug awareness and pharmaceutical workshops",
            department_id=dept_phrm.id)
        club_cultural = upsert_club(
            db, name="Cultural Committee",
            description="Annual fest organising body — dance, drama, music",
            department_id=dept_engg.id,
            level="college_wide")
        db.commit()

        # ────────────────────────────────────────────────────────────────────
        # 4. USERS — one per remaining role (+ extras for variety)
        # ────────────────────────────────────────────────────────────────────
        print("\n👤 Users")

        # ── Director ────────────────────────────────────────────────────────
        upsert_user(db, email="admin@nmims.in",
                    name="System Administrator", role="super_admin",
                    password="Admin@123")
        upsert_user(db, email="director@nmims.in",
                    name="Dr. Rajesh Mehta", role="director")

        # ── Associate Deans (one per department) ────────────────────────────
        upsert_user(db, email="dean.engg@nmims.in",
                    name="Dr. Priya Sharma", role="associate_dean",
                    department_id=dept_engg.id)
        upsert_user(db, email="dean.agri@nmims.in",
                    name="Dr. Anil Patil", role="associate_dean",
                    department_id=dept_agri.id)
        upsert_user(db, email="dean.phrm@nmims.in",
                    name="Dr. Kavita Desai", role="associate_dean",
                    department_id=dept_phrm.id)

        # ── Club Coordinators ───────────────────────────────────────────────
        coord_gdsc = upsert_user(
            db, email="coord.gdsc@nmims.in",
            name="Amit Verma", role="club_coordinator",
            department_id=dept_engg.id, club_id=club_gdsc.id)
        coord_robo = upsert_user(
            db, email="coord.robo@nmims.in",
            name="Sneha Kulkarni", role="club_coordinator",
            department_id=dept_engg.id, club_id=club_robo.id)
        coord_agri = upsert_user(
            db, email="coord.agri@nmims.in",
            name="Rahul Joshi", role="club_coordinator",
            department_id=dept_agri.id, club_id=club_agri_innov.id)
        coord_pharma = upsert_user(
            db, email="coord.pharma@nmims.in",
            name="Neha Gupta", role="club_coordinator",
            department_id=dept_phrm.id, club_id=club_pharma.id)

        # ── Students ────────────────────────────────────────────────────────
        upsert_user(db, email="student1@nmims.in",
                    name="Arjun Nair", role="student",
                    department_id=dept_engg.id, sap_id="70412300001",
                    branch="Computer Engineering", course="B.Tech",
                    year_of_study="Y3", phone_number="9876500001")
        upsert_user(db, email="student2@nmims.in",
                    name="Pooja Reddy", role="student",
                    department_id=dept_agri.id, sap_id="70412300002",
                    branch="Agronomy", course="B.Sc", year_of_study="Y2",
                    phone_number="9876500002")
        upsert_user(db, email="student3@nmims.in",
                    name="Vikram Singh", role="student",
                    department_id=dept_phrm.id, sap_id="70412300003",
                    branch="Pharmaceutics", course="B.Pharm", year_of_study="Y4",
                    phone_number="9876500003")

        # ── Additional role matrix ─────────────────────────────────────────
        # These accounts cover no access, normal dynamic access, permission
        # delegation, and both event-registration coordinator audiences.
        upsert_user(db, email="additional.viewer@nmims.in",
                    name="Ananya Viewer", role="additional", department_id=dept_engg.id,
                    extra_permissions=["view_events", "view_event_details"])
        upsert_user(db, email="additional.manager@nmims.in",
                    name="Pranav Permission Manager", role="additional", department_id=dept_engg.id,
                    extra_permissions=["view_events", "view_event_details", "manage_permissions"])
        upsert_user(db, email="additional.full@nmims.in",
                    name="Full Permission Additional User", role="additional", department_id=dept_phrm.id,
                    extra_permissions=[
                        "registration", "view_events", "view_event_details", "view_event_status",
                        "view_documents", "view_reports", "view_rnd_reports", "submit_reports",
                        "submit_rnd_reports",
                    ])
        upsert_user(db, email="additional.none@nmims.in",
                    name="No Permission User", role="additional", department_id=dept_agri.id)
        upsert_user(db, email="student.coordinator@nmims.in",
                    name="Riya Student Coordinator", role="additional", department_id=dept_engg.id,
                    coordinator_type="student",
                    extra_permissions=["registration", "view_events", "view_event_details"])
        upsert_user(db, email="student.coord@nmims.in",
                    name="Riya Student Coordinator", role="additional", department_id=dept_engg.id,
                    coordinator_type="student",
                    extra_permissions=["registration", "view_events", "view_event_details"])
        upsert_user(db, email="faculty.coordinator@nmims.in",
                    name="Dr. Meera Faculty Coordinator", role="additional", department_id=dept_engg.id,
                    coordinator_type="Faculty",
                    extra_permissions=[
                        "registration", "view_events", "view_event_details", "view_event_status",
                        "view_rnd_reports", "submit_reports", "submit_rnd_reports",
                    ])
        upsert_user(db, email="faculty.coord@nmims.in",
                    name="Dr. Meera Faculty Coordinator", role="additional", department_id=dept_engg.id,
                    coordinator_type="Faculty",
                    extra_permissions=[
                        "registration", "view_events", "view_event_details", "view_event_status",
                        "view_rnd_reports", "submit_reports", "submit_rnd_reports",
                    ])

        db.commit()

        # ── Link coordinators back to clubs ─────────────────────────────────
        print("\n🔗 Linking coordinators to clubs")
        for club_obj, coord_obj in [
            (club_gdsc, coord_gdsc),
            (club_robo, coord_robo),
            (club_agri_innov, coord_agri),
            (club_pharma, coord_pharma),
        ]:
            club_rec = db.get(Club, club_obj.id)
            if club_rec and club_rec.coordinator_id != coord_obj.id:
                club_rec.coordinator_id = coord_obj.id
                print(f"  ✓ {club_rec.name} → {coord_obj.name}")
        db.commit()

        # ── Summary ─────────────────────────────────────────────────────────
        dept_count = db.query(Department).count()
        venue_count = db.query(Venue).count()
        club_count = db.query(Club).count()
        user_count = db.query(User).count()

        print("\n" + "═" * 55)
        print("  ✅  Seed complete!")
        print(f"      Departments : {dept_count}")
        print(f"      Venues      : {venue_count}")
        print(f"      Clubs       : {club_count}")
        print(f"      Users       : {user_count}")
        print("═" * 55)
        print(f"\n  🔑  Default password for all seeded users: {DEFAULT_PASSWORD}")
        print()

    if include_events:
        # Import lazily to avoid a circular import when seed_event_data needs
        # reference data before it creates the scenario events.
        from seed_event_data import seed_events
        seed_events(create_prerequisites=False)


if __name__ == "__main__":
    seed()
