from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base


class EmailNotification(Base):
    __tablename__ = "email_notifications"

    id = Column(Integer, primary_key=True)
    recipient = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    subject = Column(String(255), nullable=True)
    sent_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    status = Column(String(20), nullable=False, default="sent")  # sent|failed
    error_message = Column(Text, nullable=True)
