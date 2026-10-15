from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class LegalAcceptance(Base):
    """
    Immutable audit record of user legal acceptances and policy acknowledgements.
    Tracks document type, exact semantic version, acceptance timestamp, status, and client metadata.
    """
    __tablename__ = "legal_acceptances"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False, index=True)  # terms_and_conditions | privacy_policy | cookie_policy | event_submission_terms
    document_version = Column(String(20), nullable=False)           # e.g., "1.0"
    accepted_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    status = Column(String(20), nullable=False, server_default="accepted")  # accepted | acknowledged | withdrawn
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)

    user = relationship("User", backref="legal_acceptances")
