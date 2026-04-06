from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import require_roles
from app.models.user import User
from app.models.email_notification import EmailNotification

router = APIRouter()


@router.get("/email-log", response_model=dict)
async def get_email_log(
    page: int = Query(1, ge=1),
    size: int = Query(30, ge=1, le=100),
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve paginated email logs for the admin dashboard."""
    # Count total emails
    count_query = select(func.count(EmailNotification.id))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Retrieve page data
    query = (
        select(EmailNotification)
        .order_by(EmailNotification.id.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Manually serialize the result
    serialized = []
    for log in logs:
        serialized.append({
            "id": log.id,
            "recipient": log.recipient,
            "type": log.type,
            "event_id": log.event_id,
            "subject": log.subject,
            "sent_at": log.sent_at.isoformat() if log.sent_at else None,
            "status": log.status,
            "error_msg": log.error_message,
        })
        
    return {"data": serialized, "total": total}
