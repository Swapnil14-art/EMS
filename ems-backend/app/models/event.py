from sqlalchemy import (
    Column, Integer, String, TIMESTAMP, ForeignKey, Boolean,
    Text, Numeric, Date,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)

    # Section A — Basic
    title = Column(String(255), nullable=False)
    event_type = Column(String(100), nullable=False)
    school_department = Column(String(150), nullable=False)
    event_incharge_name = Column(String(150), nullable=False)
    event_incharge_contact = Column(String(30), nullable=False)
    target_audience = Column(String(100), nullable=False)
    is_club_event = Column(Boolean, nullable=False, default=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    is_collaborative = Column(Boolean, nullable=False, default=False)
    is_sponsored = Column(Boolean, nullable=False, default=False)
    custom_approval_chain = Column(JSONB, nullable=True)
    departments_involved = Column(JSONB, nullable=True)  # List of strings

    # Section B — Dates/Times
    start_datetime = Column(TIMESTAMP(timezone=True), nullable=False)
    end_datetime = Column(TIMESTAMP(timezone=True), nullable=False)
    registration_start_datetime = Column(TIMESTAMP(timezone=True), nullable=True)
    registration_deadline = Column(TIMESTAMP(timezone=True), nullable=True)

    # Section C — Venue
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=True)
    venue_custom = Column(String(255), nullable=True)
    venue_type = Column(String(100), nullable=True)
    seating_arrangement = Column(String(100), nullable=True)
    seating_other_detail = Column(String(200), nullable=True)
    tables_required = Column(String(150), nullable=True)
    chairs_required = Column(String(150), nullable=True)
    podium_setup = Column(Boolean, default=False)
    podium_details = Column(Text, nullable=True)
    decoration = Column(Boolean, default=False)
    decoration_details = Column(Text, nullable=True)

    # Section D — IT
    it_projector = Column(Boolean, default=False)
    it_audio = Column(Boolean, default=False)
    it_audio_details = Column(Text, nullable=True)
    it_wifi = Column(Boolean, default=False)
    it_laptop = Column(Boolean, default=False)
    it_laptop_details = Column(Text, nullable=True)
    it_other = Column(Text, nullable=True)

    # Section E — Food
    food_items = Column(Boolean, default=False)
    food_details = Column(Text, nullable=True)
    beverage_items = Column(Boolean, default=False)
    beverage_details = Column(Text, nullable=True)
    pax_count = Column(Integer, nullable=True)
    food_service_time = Column(String(100), nullable=True)

    # Section F — Additional
    transport = Column(Boolean, default=False)
    transport_details = Column(Text, nullable=True)
    security = Column(Boolean, default=False)
    security_details = Column(Text, nullable=True)
    printing = Column(Boolean, default=False)
    printing_details = Column(Text, nullable=True)
    volunteers = Column(Boolean, default=False)
    volunteers_details = Column(Text, nullable=True)
    other_requirements = Column(Text, nullable=True)

    # Section G — Documents/Media
    poster_path = Column(Text, nullable=True)
    budget = Column(Numeric(10, 2), nullable=False)
    comments = Column(Text, nullable=True)
    participant_doc_path = Column(Text, nullable=True)

    # Section R&D — R&D Event Classification
    is_rnd_event = Column(Boolean, nullable=False, default=False)
    rnd_activity_theme = Column(String(255), nullable=True)
    rnd_prescribed_activity = Column(String(255), nullable=True)
    rnd_semester_quarter = Column(String(100), nullable=True)
    rnd_tentative_date = Column(Date, nullable=True)

    # Tracking
    status = Column(String(60), nullable=False, default="draft", index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    responsible_coordinator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    current_approval_step = Column(Integer, nullable=False, default=1)
    edit_count = Column(Integer, nullable=False, default=0)
    last_edited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_edited_at = Column(TIMESTAMP(timezone=True), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    club = relationship("Club")
    venue = relationship("Venue", foreign_keys=[venue_id])
    creator = relationship("User", foreign_keys=[created_by])
    collaborating_clubs = relationship("EventCollaboratingClub", back_populates="event", cascade="all, delete-orphan")
    venues_assoc = relationship("EventVenue", cascade="all, delete-orphan")
    venues = relationship("Venue", secondary="event_venues", viewonly=True)
    sponsors = relationship("EventSponsor", back_populates="event", cascade="all, delete-orphan")
    approvals = relationship("EventApproval", back_populates="event", cascade="all, delete-orphan")
    links = relationship("EventLink", back_populates="event", cascade="all, delete-orphan")
    documents = relationship("EventDocument", back_populates="event", cascade="all, delete-orphan")
    other_docs = relationship("EventOtherDoc", back_populates="event", cascade="all, delete-orphan")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    coordinators = relationship("EventCoordinator", back_populates="event", cascade="all, delete-orphan")
    edit_history = relationship("EventEditHistory", back_populates="event", cascade="all, delete-orphan")
    report = relationship("EventReport", back_populates="event", uselist=False, cascade="all, delete-orphan")
    rnd_report = relationship("EventRndReport", back_populates="event", uselist=False, cascade="all, delete-orphan")

class EventVenue(Base):
    __tablename__ = "event_venues"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    added_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class EventCollaboratingClub(Base):
    __tablename__ = "event_collaborating_clubs"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    added_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="collaborating_clubs")
    club = relationship("Club")


class EventSponsor(Base):
    __tablename__ = "event_sponsors"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String(255), nullable=False)
    logo_path = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="sponsors")


class EventLink(Base):
    __tablename__ = "event_links"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    link_type = Column(String(50), nullable=False)  # registration|payment|oc_form|gallery|other
    url = Column(Text, nullable=False)
    label = Column(String(150), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="links")


class EventDocument(Base):
    """Post-approval internal folder — NOT visible to students."""
    __tablename__ = "event_documents"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    title = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=True)
    url = Column(Text, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="documents")


class EventOtherDoc(Base):
    """Supporting proposal docs — max 10 per event — NOT visible to students."""
    __tablename__ = "event_other_docs"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    title = Column(String(255), nullable=True)
    file_path = Column(Text, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="other_docs")


class EventCoordinator(Base):
    """Non-club event coordinators (post-Director approval, same dept students only)."""
    __tablename__ = "event_coordinators"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    added_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    added_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="coordinators")
    user = relationship("User", foreign_keys=[user_id])


class EventEditHistory(Base):
    """Snapshot before/after post-Director edits for diff display."""
    __tablename__ = "event_edit_history"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    edited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    edited_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    old_snapshot = Column(JSONB, nullable=False)
    new_snapshot = Column(JSONB, nullable=False)

    event = relationship("Event", back_populates="edit_history")
