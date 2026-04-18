import sys
import os
import random
from datetime import datetime, timedelta, timezone

sys.path.insert(0, ".")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.event import Event
from app.models.user import User
from app.models.venue import Venue
from app.models.club import Club
from app.models.department import Department

# Setup DB session
engine = create_engine(settings.DATABASE_URL_SYNC)
Session = sessionmaker(bind=engine)

def seed_events():
    with Session() as db:
        # Fetch dynamic populations
        coordinators = db.query(User).filter_by(role="club_coordinator").all()
        venues = db.query(Venue).all()
        
        if not coordinators or not venues:
            print("Database entities not found! Please run 'python seed_all_test_data.py' first to initialize core entities.")
            return

        now = datetime.now(timezone.utc)
        target_poster = "/uploads/events/2/poster/bdec273478364f4b95dc3301d10a1409.jpg"
        target_doc = "/uploads/events/2/participant_doc/a361bb9206a7437d8a8398d976163fdb.pdf"
        
        # Matrix of statuses and their relative day logic offsets
        statuses = [
            ("draft", 10), 
            ("pending_associate_dean", 9),
            ("pending_director", 8),
            ("pending_coordinator_parallel", 7),
            ("approved", 6),
            ("ongoing", 0), 
            ("completed", -2),
            ("archived", -5),
            ("suggested_changes", 15),
            ("rejected", 20)
        ]

        event_types = ["Workshop", "Seminar", "Hackathon", "Cultural Fest", "Guest Lecture", "Code Sprint", "Debate", "Exhibition"]
        audience_types = ["college_wide", "department_only"]
        
        created_count = 0
        total_goal = 150 # Large dataset for pagination checks
        
        print(f"Generating up to {total_goal} varied events mapping across all departments...")
        
        for i in range(total_goal):
            coord = random.choice(coordinators)
            club = db.query(Club).filter_by(id=coord.club_id).first()
            
            if not club:
                continue
                
            dept = db.query(Department).filter_by(id=club.department_id).first()
            dept_name = dept.name if dept else "General"
            dept_code = dept.code if dept else "GEN"
            
            venue = random.choice(venues)
            status, day_offset = random.choice(statuses)
            
            # Generate logically sound dates
            if status == "ongoing":
                start_dt = now - timedelta(minutes=random.randint(15, 60))
                end_dt = now + timedelta(hours=random.randint(1, 4))
            elif day_offset > 0:
                # Future states
                start_dt = now + timedelta(days=day_offset, hours=random.randint(1, 8))
                end_dt = start_dt + timedelta(hours=random.randint(1, 6))
            else:
                # Past states
                start_dt = now + timedelta(days=day_offset, hours=-random.randint(1, 10))
                end_dt = start_dt + timedelta(hours=random.randint(2, 6))
            
            e_type = random.choice(event_types)
            title = f"{dept_code} {e_type} - {status.replace('_', ' ').title()} (Var {i})"
            
            # Determine Audience
            a_type = random.choice(audience_types)
            if a_type == "department_only":
                target_audience = dept.code if dept else "General"
            else:
                target_audience = "college_wide"
            
            existing = db.query(Event).filter_by(title=title).first()
            if not existing:
                is_collab = True if status == "pending_coordinator_parallel" else random.choice([True, False, False])
                
                evt = Event(
                    title=title,
                    event_type=e_type,
                    school_department=dept_name,
                    event_incharge_name=coord.name,
                    event_incharge_contact=f"98765{random.randint(10000, 99999)}",
                    target_audience=target_audience,
                    is_club_event=True,
                    club_id=club.id,
                    is_collaborative=is_collab,
                    is_sponsored=random.choice([True, False]),
                    venue_id=venue.id,
                    budget=random.randint(1500, 50000),
                    created_by=coord.id,
                    poster_path=target_poster,
                    participant_doc_path=target_doc if status == "approved" and random.choice([True, False]) else None,
                    status=status,
                    start_datetime=start_dt,
                    end_datetime=end_dt,
                )
                db.add(evt)
                created_count += 1
                
                # Check bulk insert limits to avoid flushing too long
                if created_count % 30 == 0:
                    db.flush()
                
        db.commit()
        print(f"Successfully seeded {created_count} diverse events across departments!")

if __name__ == "__main__":
    seed_events()
