from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
import logging

from app.database import get_db
from app.config import settings
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.legal import LegalAcceptance
from app.schemas.legal import (
    LegalAcceptanceBatchRequest,
    LegalAcceptanceResponse,
    LegalStatusResponse,
    LegalVersionsResponse,
)

logger = logging.getLogger("ems.legal")

router = APIRouter()

VALID_DOCUMENT_TYPES = {
    "terms_and_conditions",
    "privacy_policy",
    "cookie_policy",
    "event_submission_terms",
}

REQUIRED_ONBOARDING_DOCUMENTS = [
    "terms_and_conditions",
    "privacy_policy",
]


def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP, preferring X-Forwarded-For if behind a reverse proxy like Nginx."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


@router.get("/versions", response_model=LegalVersionsResponse)
async def get_legal_versions():
    """
    Public endpoint returning the current semantic version of all legal documents
    and designated privacy/grievance contact details.
    """
    return LegalVersionsResponse(
        current_versions={
            "terms_and_conditions": settings.CURRENT_TERMS_VERSION,
            "privacy_policy": settings.CURRENT_PRIVACY_VERSION,
            "cookie_policy": settings.CURRENT_COOKIE_VERSION,
        },
        effective_dates={
            "terms_and_conditions": "2026-09-25",
            "privacy_policy": "2026-09-25",
            "cookie_policy": "2026-09-25",
        },
        operator_name=settings.LEGAL_ENTITY_NAME,
        privacy_officer_name=settings.PRIVACY_OFFICER_NAME,
        privacy_officer_email=settings.PRIVACY_OFFICER_EMAIL,
        grievance_officer_name=settings.GRIEVANCE_OFFICER_NAME,
        grievance_officer_email=settings.GRIEVANCE_OFFICER_EMAIL,
        grievance_officer_address=settings.GRIEVANCE_OFFICER_ADDRESS,
    )


@router.get("/status", response_model=LegalStatusResponse)
async def get_legal_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Checks whether the authenticated user has accepted the latest required legal documents.
    Used to prompt existing users non-destructively upon login or profile access.
    """
    current_versions = {
        "terms_and_conditions": settings.CURRENT_TERMS_VERSION,
        "privacy_policy": settings.CURRENT_PRIVACY_VERSION,
    }

    # Fetch user's latest acceptance for each required document
    query = (
        select(LegalAcceptance)
        .where(
            LegalAcceptance.user_id == current_user.id,
            LegalAcceptance.document_type.in_(REQUIRED_ONBOARDING_DOCUMENTS),
            LegalAcceptance.status.in_(["accepted", "acknowledged"]),
        )
        .order_by(desc(LegalAcceptance.accepted_at))
    )
    result = await db.execute(query)
    acceptances = result.scalars().all()

    accepted_versions: dict[str, Optional[str]] = {doc: None for doc in REQUIRED_ONBOARDING_DOCUMENTS}
    for acc in acceptances:
        if accepted_versions[acc.document_type] is None:
            accepted_versions[acc.document_type] = acc.document_version

    missing_docs = []
    for doc, req_version in current_versions.items():
        user_ver = accepted_versions.get(doc)
        if user_ver != req_version:
            missing_docs.append(doc)

    return LegalStatusResponse(
        requires_acceptance=len(missing_docs) > 0,
        missing_documents=missing_docs,
        current_versions=current_versions,
        accepted_versions=accepted_versions,
    )


@router.post("/accept", response_model=List[LegalAcceptanceResponse])
async def accept_legal_documents(
    request: Request,
    payload: LegalAcceptanceBatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Records immutable user acceptance or acknowledgement of legal documents.
    Captures document version, timestamp, client IP, and user-agent.
    """
    if not payload.acceptances:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one legal acceptance record must be provided.",
        )

    ip_address = get_client_ip(request)
    raw_ua = request.headers.get("user-agent", "")
    user_agent = raw_ua[:255] if raw_ua else None

    records = []
    for item in payload.acceptances:
        if item.document_type not in VALID_DOCUMENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document type: {item.document_type}",
            )

        new_record = LegalAcceptance(
            user_id=current_user.id,
            document_type=item.document_type,
            document_version=item.document_version,
            status=item.status,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(new_record)
        records.append(new_record)

    await db.commit()
    for rec in records:
        await db.refresh(rec)

    logger.info(
        "Recorded legal acceptance for user_id=%s documents=%s",
        current_user.id,
        [r.document_type for r in records],
    )
    return records


@router.get("/my-acceptances", response_model=List[LegalAcceptanceResponse])
async def get_my_legal_acceptances(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the authenticated user's own legal acceptance and policy acknowledgement history.
    Users cannot view or modify other users' legal records.
    """
    query = (
        select(LegalAcceptance)
        .where(LegalAcceptance.user_id == current_user.id)
        .order_by(desc(LegalAcceptance.accepted_at))
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/audit", response_model=List[LegalAcceptanceResponse])
async def get_legal_audit_log(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Super Admin only endpoint for institutional compliance audit logs.
    """
    query = select(LegalAcceptance)
    if user_id:
        query = query.where(LegalAcceptance.user_id == user_id)
    if document_type:
        query = query.where(LegalAcceptance.document_type == document_type)

    query = query.order_by(desc(LegalAcceptance.accepted_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
