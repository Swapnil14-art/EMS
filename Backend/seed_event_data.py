"""Deterministic, idempotent event fixtures for every major EMS workflow.

Run directly for all prerequisites + scenarios, or let seed_all_test_data call
seed_events(False) after it has created reference data and users.
"""
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, ".")
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.event import Event, EventCollaboratingClub, EventVenue
from app.models.event_approval import EventApproval
from app.models.event_registration import EventRegistration
from app.models.event_report import EventReport
from app.models.event_rnd_report import EventRndReport
from app.models.user import User
from app.models.venue import Venue
from app.models.club import Club

Session = sessionmaker(bind=create_engine(settings.DATABASE_URL_SYNC))


def get_user(db, email):
    value = db.query(User).filter_by(email=email).first()
    if not value:
        raise RuntimeError(f"Missing fixture user {email}; run seed_all_test_data.py first.")
    return value


def upsert_event(db, title, creator, club, venue, status, start, end, **changes):
    """Create/update a richly populated event. Every rerun restores fixture state."""
    values = {
        "event_type": "workshop", "school_department": "Engineering", "target_audience": "college_wide",
        "event_incharge_name": creator.name, "event_incharge_contact": "9876501000",
        "is_club_event": True, "club_id": club.id, "is_collaborative": False, "is_sponsored": True,
        "objectives": ["Validate EMS workflow", "Cover registration and reports"],
        "start_datetime": start, "end_datetime": end, "registration_start_datetime": None,
        "registration_deadline": None, "venue_id": venue.id, "venue_type": "on_campus",
        "departments_involved": ["ENGG"], "faculty_involved_emails": ["faculty@nmims.edu"],
        "seating_arrangement": "theatre", "tables_required": "6", "chairs_required": "120",
        "podium_setup": True, "podium_details": "Central lectern", "decoration": True,
        "decoration_details": "Institutional backdrop", "it_projector": True, "it_audio": True,
        "it_audio_details": "PA system and two wireless microphones", "it_wifi": True,
        "it_laptop": True, "it_laptop_details": "Presenter laptop", "it_other": "HDMI adapter",
        "food_items": True, "food_details": "Tea, snacks, and lunch", "beverage_items": True,
        "beverage_details": "Water and tea", "pax_count": 120, "food_service_time": "12:30 PM",
        "transport": True, "transport_details": "Campus shuttle", "security": True,
        "security_details": "Two security staff", "printing": True, "printing_details": "50 brochures",
        "volunteers": True, "volunteers_details": "10 student volunteers", "other_requirements": "First-aid desk",
        "budget": 25000, "budget_breakdown": [{"category": "Venue", "amount": 5000}, {"category": "Food", "amount": 12000}, {"category": "Technical", "amount": 8000}],
        "comments": "Deterministic EMS test fixture", "poster_path": "/uploads/events/test/poster/sample.jpg",
        "participant_doc_path": "/uploads/events/test/participant_doc/terms.pdf", "outside_campus_registration": False,
        "registration_accepted": False, "student_registration_enabled": False, "faculty_registration_enabled": False,
        "status": status, "created_by": creator.id, "responsible_coordinator_id": creator.id,
        "current_approval_step": 1, "is_rnd_event": False, "rnd_activity_theme": None,
        "rnd_prescribed_activity": None, "rnd_semester_quarter": None, "rnd_tentative_date": None,
    }
    values.update(changes)
    value = db.query(Event).filter_by(title=title).first()
    if not value:
        value = Event(title=title, **values)
        db.add(value); db.flush(); print(f"  + {title}")
    else:
        for key, field in values.items(): setattr(value, key, field)
        print(f"  · {title} (updated)")
    return value


def set_approvals(db, event, rows):
    db.query(EventApproval).filter_by(event_id=event.id).delete()
    for user, role, order, action, parallel in rows:
        db.add(EventApproval(event_id=event.id, approver_id=user.id, role_at_approval=role,
            sequence_order=order, action=action, is_parallel=parallel, remarks=f"Seeded {action}", actioned_at=datetime.now(timezone.utc)))


def set_registration(db, event, *, user=None, visitor_email=None, status="registered"):
    item = db.query(EventRegistration).filter_by(event_id=event.id, student_id=user.id).first() if user else db.query(EventRegistration).filter_by(event_id=event.id, visitor_email=visitor_email).first()
    if not item:
        item = EventRegistration(event_id=event.id, student_id=user.id if user else None,
            participation_type="in_campus" if user else "visitor", visitor_email=visitor_email)
        db.add(item)
    item.status = status
    if not user:
        item.visitor_name, item.visitor_phone = "Aarav External", "9876500999"
        item.visitor_qualification, item.visitor_school_college = "M.Sc.", "External Institute"


def set_reports(db, standard, rnd, submitter):
    fields = dict(submitted_by=submitter.id, event_summary="Complete seeded report", actual_budget=22000,
        outcomes="Documented learning outcome", issues="No material issues", feedback="Positive feedback",
        student_count=80, faculty_count=12, external_count=8, program_type="Workshop", mode_of_delivery="offline",
        objective="Practical learning", learning_benefit="Participants gained hands-on experience",
        guest_speakers=[{"name": "Dr. Seed", "designation": "Expert", "organization": "NMIMS", "expertise": "Testing"}],
        faculty_coordinators=["Dr. Meera Faculty Coordinator"], student_coordinators=["Riya Student Coordinator"],
        social_pamphlet={"instagram": "https://example.com/pamphlet"}, social_video={"youtube": "https://example.com/video"},
        speaker_background="Industry expert", session_report="Complete session report", key_outcomes=["Attendance tracked", "Reports generated"],
        conclusion="Fixture complete", attendance_doc_path="/uploads/events/test/report/attendance.xlsx",
        flier_path="/uploads/events/test/report/flier.jpg", generated_report_path="/uploads/events/test/report/report.docx")
    for model, event in ((EventReport, standard), (EventRndReport, rnd)):
        report = db.query(model).filter_by(event_id=event.id).first()
        if not report: db.add(model(event_id=event.id, **fields))
        else:
            for key, field in fields.items(): setattr(report, key, field)


def seed_events(create_prerequisites=True):
    if create_prerequisites:
        from seed_all_test_data import seed
        seed(include_events=False)
    with Session() as db:
        coordinator, parallel_coordinator, dean, director = (get_user(db, email) for email in ("coord.gdsc@nmims.in", "coord.robo@nmims.in", "dean.engg@nmims.in", "director@nmims.in"))
        student, student_coord, faculty_coord = (get_user(db, email) for email in ("student1@nmims.in", "student.coordinator@nmims.in", "faculty.coordinator@nmims.in"))
        club, collaborator = (db.query(Club).filter_by(name=name).first() for name in ("Google DSC", "Robotics Club"))
        venue, secondary = (db.query(Venue).filter_by(name=name).first() for name in ("Main Auditorium", "Seminar Hall A"))
        if not all((club, collaborator, venue, secondary)): raise RuntimeError("Missing fixture clubs or venues")
        now = datetime.now(timezone.utc); future = now + timedelta(days=10); past = now - timedelta(days=8)
        print("\n📅 Event scenarios")
        student_open = upsert_event(db, "[TEST] Student Registration Open", coordinator, club, venue, "approved", future, future + timedelta(hours=4), target_audience="ENGG", registration_start_datetime=now-timedelta(days=2), registration_deadline=now+timedelta(days=5), registration_accepted=True, student_registration_enabled=True)
        faculty_open = upsert_event(db, "[TEST] Faculty Registration Open", coordinator, club, venue, "approved", future+timedelta(days=1), future+timedelta(days=1, hours=4), registration_start_datetime=now-timedelta(days=2), registration_deadline=now+timedelta(days=5), registration_accepted=True, faculty_registration_enabled=True)
        both_open = upsert_event(db, "[TEST] Student and Faculty Registration Open", coordinator, club, secondary, "ongoing", now-timedelta(hours=1), now+timedelta(hours=3), registration_start_datetime=now-timedelta(days=1), registration_deadline=now+timedelta(days=1), registration_accepted=True, student_registration_enabled=True, faculty_registration_enabled=True, outside_campus_registration=True)
        upsert_event(db, "[TEST] Registration Not Yet Open", coordinator, club, venue, "approved", future+timedelta(days=2), future+timedelta(days=2, hours=4), target_audience="ENGG", registration_start_datetime=now+timedelta(days=1), registration_deadline=now+timedelta(days=7), registration_accepted=True, student_registration_enabled=True)
        upsert_event(db, "[TEST] Registration Closed", coordinator, club, venue, "approved", future+timedelta(days=3), future+timedelta(days=3, hours=4), target_audience="ENGG", registration_start_datetime=now-timedelta(days=7), registration_deadline=now-timedelta(days=1), registration_accepted=True, student_registration_enabled=True)
        draft = upsert_event(db, "[TEST] Draft Event", coordinator, club, venue, "draft", future+timedelta(days=4), future+timedelta(days=4, hours=4))
        upsert_event(db, "[TEST] Associate Dean Approval Pending", coordinator, club, venue, "pending_associate_dean", future+timedelta(days=4, hours=6), future+timedelta(days=4, hours=10))
        pending = upsert_event(db, "[TEST] Collaborative Approval Pending", coordinator, club, venue, "pending_coordinator_parallel", future+timedelta(days=5), future+timedelta(days=5, hours=4), is_collaborative=True, departments_involved=["ENGG", "AGRI"])
        upsert_event(db, "[TEST] Director Approval Pending", coordinator, club, venue, "pending_director", future+timedelta(days=5, hours=6), future+timedelta(days=5, hours=10))
        completed = upsert_event(db, "[TEST] Completed Standard Report", coordinator, club, venue, "completed", past-timedelta(hours=4), past, registration_accepted=True, student_registration_enabled=True, faculty_registration_enabled=True)
        rnd = upsert_event(db, "[TEST] Archived RnD Report", coordinator, club, venue, "archived", past-timedelta(days=5, hours=4), past-timedelta(days=5), is_rnd_event=True, rnd_activity_theme="Innovation and Entrepreneurship", rnd_prescribed_activity="IIC innovation workshop", rnd_semester_quarter="Semester 5 / Q1", rnd_tentative_date=(now-timedelta(days=13)).date())
        upsert_event(db, "[TEST] Suggested Changes", coordinator, club, venue, "suggested_changes", future+timedelta(days=6), future+timedelta(days=6, hours=4))
        upsert_event(db, "[TEST] Rejected Event", coordinator, club, venue, "rejected", future+timedelta(days=7), future+timedelta(days=7, hours=4))
        upsert_event(db, "[TEST] Cancelled Event", coordinator, club, venue, "cancelled", future+timedelta(days=8), future+timedelta(days=8, hours=4), cancellation_reason="Fixture cancellation coverage", cancelled_by=coordinator.id)
        db.query(EventCollaboratingClub).filter_by(event_id=pending.id).delete(); db.add(EventCollaboratingClub(event_id=pending.id, club_id=collaborator.id))
        for event in (student_open, faculty_open, both_open, draft, pending, completed, rnd):
            selected = secondary if event.venue_id == secondary.id else venue
            if not db.query(EventVenue).filter_by(event_id=event.id, venue_id=selected.id).first(): db.add(EventVenue(event_id=event.id, venue_id=selected.id))
        approved = [(coordinator, "club_coordinator", 1, "approved", False), (dean, "associate_dean", 2, "approved", False), (director, "director", 3, "approved", False)]
        set_approvals(db, student_open, approved); set_approvals(db, completed, approved)
        set_approvals(db, pending, [(coordinator, "club_coordinator", 1, "approved", True), (parallel_coordinator, "club_coordinator", 1, "pending", True)])
        set_registration(db, student_open, user=student); set_registration(db, student_open, user=student_coord)
        set_registration(db, faculty_open, user=faculty_coord); set_registration(db, both_open, visitor_email="visitor.fixture@example.com")
        set_reports(db, completed, rnd, faculty_coord); db.commit()
        print("  ✅ 14 scenarios seeded: all event workflow states, registration paths, approvals, registrations, and reports.")


if __name__ == "__main__":
    seed_events()
