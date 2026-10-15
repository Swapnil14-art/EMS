"""
seed_presentation_data.py
=========================
One-shot script that creates a clean, presentation-ready database.

Run INSIDE Docker:
    docker exec ems_backend python seed_presentation_data.py

Run locally (DATABASE_URL_SYNC must be set in .env):
    cd ems-backend
    python seed_presentation_data.py

What gets seeded
----------------
USERS
  admin@nmims.in          Super Admin          Admin@123
  director@nmims.in       Director             Test@123
  dean.engg@nmims.in      Associate Dean       Test@123  (Engineering)
  coord.gdsc@nmims.in     Club Coordinator     Test@123  (Google DSC – Engineering)
  coord.tech@nmims.in     Club Coordinator     Test@123  (TechNova Club – Engineering)
  student1@nmims.in       Student              Test@123  (Engineering)
  student2@nmims.in       Student              Test@123  (Engineering)

EVENTS
  A) "TechFest 2026 – Innovation Showcase"
       status  : approved (fully live)
       open for outsiders + on-campus registration
       registration window : CURRENTLY OPEN
       venue   : Main Auditorium  (Aug 20 09:00 – Aug 20 17:00)
       coord   : coord.gdsc@nmims.in
       students 1 & 2 are registered

  B) "Cloud Computing Workshop" (COMPLETED – for report demo)
       status  : completed
       all approval stages done
       event report submitted
       coord   : coord.tech@nmims.in
"""

from app import database
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, ".")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.user import User
from app.models.department import Department
from app.models.venue import Venue
from app.models.club import Club
from app.models.event import (
    Event, EventVenue, EventDocument, EventOtherDoc,
)
from app.models.event_approval import EventApproval
from app.models.event_registration import EventRegistration
from app.models.event_report import EventReport
from app.models import (  # noqa: F401 – ensure all tables exist
    department, club, event, venue,
    event_approval, event_registration,
    event_report, email_notification,
)
from app.utils.security import get_password_hash

# ── Config ────────────────────────────────────────────────────────────────────
ADMIN_PASSWORD  = "Admin@123"
DEFAULT_PASSWORD = "Test@123"

NOW = datetime.now(timezone.utc)

engine  = create_engine(settings.DATABASE_URL_SYNC)
Session = sessionmaker(bind=engine)


# ── Helpers ───────────────────────────────────────────────────────────────────

def upsert_dept(db, name, code):
    obj = db.query(Department).filter_by(code=code).first()
    if not obj:
        obj = Department(name=name, code=code)
        db.add(obj); db.flush()
        print(f"  + Dept: {name}")
    else:
        print(f"  · Dept exists: {name}")
    return obj


def upsert_venue(db, *, name, location, max_capacity, aliases=None, department_id=None):
    obj = db.query(Venue).filter_by(name=name).first()
    if not obj:
        obj = Venue(name=name, location=location, max_capacity=max_capacity,
                    aliases=aliases, department_id=department_id, is_active=True)
        db.add(obj); db.flush()
        print(f"  + Venue: {name}")
    else:
        print(f"  · Venue exists: {name}")
    return obj


def upsert_club(db, *, name, description, department_id, level="department"):
    obj = db.query(Club).filter_by(name=name).first()
    if not obj:
        obj = Club(name=name, description=description,
                   department_id=department_id, level=level, is_active=True)
        db.add(obj); db.flush()
        print(f"  + Club: {name}")
    else:
        print(f"  · Club exists: {name}")
    return obj


def upsert_user(db, *, email, name, role, password, department_id=None, club_id=None,
                sap_id=None, phone_number=None, year_of_study=None,
                branch=None, course=None):
    obj = db.query(User).filter_by(email=email).first()
    if not obj:
        obj = User(
            email=email, name=name, role=role, status="active",
            hashed_password=get_password_hash(password),
            is_first_login=False,
            department_id=department_id, club_id=club_id,
            sap_id=sap_id, phone_number=phone_number,
            year_of_study=year_of_study, branch=branch, course=course,
        )
        db.add(obj); db.flush()
        print(f"  + User: {name} <{email}>  [{role}]")
    else:
        obj.hashed_password = get_password_hash(password)
        obj.is_first_login = False
        obj.status = "active"
        obj.department_id = department_id
        obj.club_id = club_id
        if sap_id:        obj.sap_id        = sap_id
        if phone_number:  obj.phone_number  = phone_number
        if year_of_study: obj.year_of_study = year_of_study
        if branch:        obj.branch        = branch
        if course:        obj.course        = course
        print(f"  · User updated: {name} <{email}>")
    return obj


def add_approval(db, event_id, approver_id, role, seq, action, actioned_at=None, remarks=None):
    existing = (db.query(EventApproval)
                  .filter_by(event_id=event_id, sequence_order=seq)
                  .first())
    if not existing:
        a = EventApproval(
            event_id=event_id,
            approver_id=approver_id,
            role_at_approval=role,
            sequence_order=seq,
            action=action,
            remarks=remarks,
            actioned_at=actioned_at or (NOW if action != "pending" else None),
        )
        db.add(a); db.flush()


def add_event_venue(db, event_id, venue_id):
    existing = db.query(EventVenue).filter_by(event_id=event_id, venue_id=venue_id).first()
    if not existing:
        db.add(EventVenue(event_id=event_id, venue_id=venue_id))
        db.flush()


def add_document(db, event_id, title, uploaded_by_id):
    doc = EventDocument(
        event_id=event_id,
        title=title,
        file_path=f"storage/demo/{title.lower().replace(' ', '_')}.pdf",
        uploaded_by=uploaded_by_id,
    )
    db.add(doc); db.flush()
    print(f"    + Doc: {title}")


def add_other_doc(db, event_id, title, uploaded_by_id):
    doc = EventOtherDoc(
        event_id=event_id,
        title=title,
        file_path=f"storage/demo/proposal_{title.lower().replace(' ', '_')}.pdf",
        uploaded_by=uploaded_by_id,
    )
    db.add(doc); db.flush()


def add_registration(db, event_id, student_id=None, ptype="in_campus",
                     visitor_name=None, visitor_email=None,
                     visitor_phone=None, visitor_qualification=None,
                     visitor_school=None):
    existing = db.query(EventRegistration).filter_by(
        event_id=event_id, student_id=student_id).first()
    if not existing:
        reg = EventRegistration(
            event_id=event_id,
            student_id=student_id,
            participation_type=ptype,
            status="registered",
            visitor_name=visitor_name,
            visitor_email=visitor_email,
            visitor_phone=visitor_phone,
            visitor_qualification=visitor_qualification,
            visitor_school_college=visitor_school,
        )
        db.add(reg); db.flush()
        print(f"    + Registration: student_id={student_id or 'visitor'}")


# ── Main seed ─────────────────────────────────────────────────────────────────

def seed():
    with Session() as db:

        # ── 1. DEPARTMENT ────────────────────────────────────────────────────
        print("\n📁 Department")
        dept_engg = upsert_dept(db, "School of Engineering", "ENGG")
        db.commit()

        # ── 2. VENUES ────────────────────────────────────────────────────────
        print("\n🏛️  Venues")
        venue_audi = upsert_venue(
            db, name="Main Auditorium",
            location="Central Block, Ground Floor",
            max_capacity=3,
            aliases="auditorium,main hall",
        )
        venue_semA = upsert_venue(
            db, name="Seminar Hall A",
            location="Engineering Block, 1st Floor",
            max_capacity=2,
            aliases="seminar A,sem hall A",
            department_id=dept_engg.id,
        )
        venue_conf = upsert_venue(
            db, name="Conference Room",
            location="Admin Block, 2nd Floor",
            max_capacity=1,
            aliases="conf room,meeting room",
        )
        db.commit()

        # ── 3. CLUBS ─────────────────────────────────────────────────────────
        print("\n🎭 Clubs")
        club_gdsc = upsert_club(
            db, name="Google DSC",
            description="Google Developer Student Clubs – workshops, hackathons and tech talks",
            department_id=dept_engg.id,
        )
        club_tech = upsert_club(
            db, name="TechNova Club",
            description="Innovation-driven tech club for cloud, AI and product engineering",
            department_id=dept_engg.id,
        )
        db.commit()

        # ── 4. USERS ─────────────────────────────────────────────────────────
        print("\n👤 Users")

        # Admin
        admin = upsert_user(
            db, email="admin@nmims.in", name="Super Admin",
            role="super_admin", password=ADMIN_PASSWORD,
        )

        # Director
        director = upsert_user(
            db, email="director@nmims.in", name="Dr. Rajesh Mehta",
            role="director", password=DEFAULT_PASSWORD,
        )

        # Associate Dean – Engineering ONLY
        dean = upsert_user(
            db, email="dean.engg@nmims.in", name="Dr. Priya Sharma",
            role="associate_dean", password=DEFAULT_PASSWORD,
            department_id=dept_engg.id,
        )

        # Coordinator 1 – Google DSC
        coord1 = upsert_user(
            db, email="coord.gdsc@nmims.in", name="Amit Verma",
            role="club_coordinator", password=DEFAULT_PASSWORD,
            department_id=dept_engg.id, club_id=club_gdsc.id,
        )

        # Coordinator 2 – TechNova
        coord2 = upsert_user(
            db, email="coord.tech@nmims.in", name="Sneha Kulkarni",
            role="club_coordinator", password=DEFAULT_PASSWORD,
            department_id=dept_engg.id, club_id=club_tech.id,
        )

        # Students – Engineering (full profiles for live demo registration)
        student1 = upsert_user(
            db, email="student1@nmims.in", name="Arjun Nair",
            role="student", password=DEFAULT_PASSWORD,
            department_id=dept_engg.id,
            sap_id="70232100010",
            phone_number="9876501010",
            year_of_study="3",
            branch="Computer Engineering",
            course="B.Tech",
        )
        student2 = upsert_user(
            db, email="student2@nmims.in", name="Pooja Reddy",
            role="student", password=DEFAULT_PASSWORD,
            department_id=dept_engg.id,
            sap_id="70232100025",
            phone_number="9876502020",
            year_of_study="2",
            branch="Information Technology",
            course="B.Tech",
        )

        db.commit()

        # Link coordinators to their clubs
        print("\n🔗 Linking coordinators to clubs")
        club_gdsc_obj = db.get(Club, club_gdsc.id)
        if club_gdsc_obj:
            club_gdsc_obj.coordinator_id = coord1.id
        club_tech_obj = db.get(Club, club_tech.id)
        if club_tech_obj:
            club_tech_obj.coordinator_id = coord2.id
        db.commit()

        # ── 5. EVENT A — LIVE / OPEN REGISTRATION ────────────────────────────
        print("\n📅 Event A – TechFest 2026 (LIVE, registration open)")

        # Event dates: next Aug 20 using current system year
        year = NOW.year
        # Event A: Aug 20, 09:00 – 17:00 IST (UTC+5:30)
        ist_offset = timedelta(hours=5, minutes=30)
        ev_a_start = datetime(year, 9, 28, 9, 0, 0, tzinfo=timezone(ist_offset))
        ev_a_end   = datetime(year, 9, 28, 17, 0, 0, tzinfo=timezone(ist_offset))
        # Registration window: TODAY – 7 days ago  to  30 days from now (window is OPEN)
        reg_start  = NOW - timedelta(days=7)
        reg_end    = NOW + timedelta(days=30)

        event_a = db.query(Event).filter_by(title="TechFest 2026 – Innovation Showcase").first()
        if not event_a:
            event_a = Event(
                title="TechFest 2026 – Innovation Showcase",
                event_type="Technical",
                school_department="School of Engineering",
                event_incharge_name="Amit Verma",
                event_incharge_contact="9876543210",
                target_audience="UG Students",
                is_club_event=True,
                club_id=club_gdsc.id,
                is_collaborative=False,
                is_sponsored=False,
                # Dates
                start_datetime=ev_a_start,
                end_datetime=ev_a_end,
                registration_start_datetime=reg_start,
                registration_deadline=reg_end,
                # Venue
                venue_id=venue_audi.id,
                venue_type="on_campus",
                seating_arrangement="Theatre",
                # IT
                it_projector=True,
                it_audio=True,
                it_audio_details="2 lapel mics + PA system",
                it_wifi=True,
                # Food
                food_items=True,
                food_details="Snacks and beverages during break",
                pax_count=200,
                food_service_time="12:30 PM",
                # Additional
                volunteers=True,
                volunteers_details="15 student volunteers needed",
                # Budget & docs
                budget=25000.00,
                comments="TechFest 2026 - Innovation Showcase",
                # Registration flags
                outside_campus_registration=True,   # open to outsiders
                registration_accepted=True,          # on-campus registration also ON
                # Status
                status="approved",
                created_by=coord1.id,
                responsible_coordinator_id=coord1.id,
                current_approval_step=4,
                poster_path="/login-bg.jpg",
            )
            db.add(event_a); db.flush()
            print(f"  + Event A id={event_a.id}")
        else:
            event_a.poster_path = "/login-bg.jpg"
            print(f"  · Event A exists id={event_a.id}")

        # Attach venue to event_venues table as well
        add_event_venue(db, event_a.id, venue_audi.id)

        # Full approval chain for Event A (all approved)
        add_approval(db, event_a.id, coord1.id,   "club_coordinator",  1, "approved",
                     NOW - timedelta(days=14), "Event proposal looks good.")
        add_approval(db, event_a.id, dean.id,     "associate_dean",    2, "approved",
                     NOW - timedelta(days=13), "Approved from Dean side.")
        add_approval(db, event_a.id, director.id, "director",          3, "approved",
                     NOW - timedelta(days=12), "Approved. Best of luck!")
        db.commit()

        # NOTE: No pre-seeded registrations for Event A.
        # During the DEMO: log in as student1 / student2 and register live
        # to show the coordinator's registration list in real time.
        db.commit()

        # ── 6. EVENT B — COMPLETED (documents + report) ──────────────────────
        print("\n📅 Event B – Cloud Computing Workshop (COMPLETED)")

        ev_b_start = datetime(year, 7, 10, 10, 0, 0, tzinfo=timezone(ist_offset))
        ev_b_end   = datetime(year, 7, 10, 16, 0, 0, tzinfo=timezone(ist_offset))

        event_b = db.query(Event).filter_by(title="Cloud Computing Workshop").first()
        if not event_b:
            event_b = Event(
                title="Cloud Computing Workshop",
                event_type="Workshop",
                school_department="School of Engineering",
                event_incharge_name="Sneha Kulkarni",
                event_incharge_contact="9988776655",
                target_audience="UG Students",
                is_club_event=True,
                club_id=club_tech.id,
                is_collaborative=False,
                is_sponsored=False,
                start_datetime=ev_b_start,
                end_datetime=ev_b_end,
                venue_id=venue_semA.id,
                venue_type="on_campus",
                seating_arrangement="Classroom",
                it_projector=True,
                it_laptop=True,
                it_laptop_details="20 lab laptops",
                it_wifi=True,
                budget=8000.00,
                outside_campus_registration=False,
                registration_accepted=False,
                status="completed",
                created_by=coord2.id,
                responsible_coordinator_id=coord2.id,
                current_approval_step=4,
            )
            db.add(event_b); db.flush()
            print(f"  + Event B id={event_b.id}")
        else:
            print(f"  · Event B exists id={event_b.id}")

        add_event_venue(db, event_b.id, venue_semA.id)

        # Full approval chain for Event B
        add_approval(db, event_b.id, coord2.id,   "club_coordinator",  1, "approved",
                     NOW - timedelta(days=45), "Workshop plan attached.")
        add_approval(db, event_b.id, dean.id,     "associate_dean",    2, "approved",
                     NOW - timedelta(days=44), "Good initiative.")
        add_approval(db, event_b.id, director.id, "director",          3, "approved",
                     NOW - timedelta(days=43), "Approved.")
        db.commit()

        # No documents uploaded for Event B
        db.commit()

        # ── Summary ──────────────────────────────────────────────────────────
        from app.models.event import Event as Ev
        from app.models.event_registration import EventRegistration as ER
        from app.models.event_report import EventReport as ERp

        u_count  = db.query(User).count()
        ev_count = db.query(Ev).count()
        reg_count = db.query(ER).count()
        rep_count = db.query(ERp).count()

        print("\n" + "═" * 60)
        print("  ✅  PRESENTATION SEED COMPLETE!")
        print("═" * 60)
        print(f"  Users         : {u_count}")
        print(f"  Events        : {ev_count}")
        print(f"  Registrations : {reg_count}")
        print(f"  Reports       : {rep_count}")
        print("═" * 60)
        print()
        print("  CREDENTIALS")
        print("  ─────────────────────────────────────────────────────")
        print("  admin@nmims.in          Admin@123   [super_admin]")
        print("  director@nmims.in       Test@123    [director]")
        print("  dean.engg@nmims.in      Test@123    [associate_dean]")
        print("  coord.gdsc@nmims.in     Test@123    [club_coordinator – Google DSC]")
        print("  coord.tech@nmims.in     Test@123    [club_coordinator – TechNova]")
        print("  student1@nmims.in       Test@123    [student]")
        print("  student2@nmims.in       Test@123    [student]")
        print()
        print("  EVENTS")
        print("  ─────────────────────────────────────────────────────")
        print(f"  A) TechFest 2026          [APPROVED]  id={event_a.id}")
        print(f"     Main Auditorium | Aug {year}-08-20 09:00–17:00 IST")
        print(f"     Registration OPEN | outsiders + on-campus")
        print()
        print(f"  B) Cloud Computing Workshop [COMPLETED] id={event_b.id}")
        print(f"     Seminar Hall A  | Jul {year}-07-10 10:00–16:00 IST")
        print(f"     Report submitted")
        print("═" * 60)
        print()


if __name__ == "__main__":
    seed()
