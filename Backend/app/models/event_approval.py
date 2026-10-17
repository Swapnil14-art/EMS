from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class EventApproval(Base):
    __tablename__ = "event_approvals"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_at_approval = Column(String(50), nullable=False)
    sequence_order = Column(Integer, nullable=False)
    is_parallel = Column(Boolean, nullable=False, default=False)
    parallel_group = Column(Integer, nullable=True)
    action = Column(String(20), nullable=False, default="pending")  # pending|approved|rejected|suggested_changes
    remarks = Column(Text, nullable=True)
    venue_clash_override = Column(Boolean, nullable=False, default=False)
    venue_clash_override_reason = Column(Text, nullable=True)
    actioned_at = Column(TIMESTAMP(timezone=True), nullable=True)

    event = relationship("Event", back_populates="approvals")
    approver = relationship("User")
