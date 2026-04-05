from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.event import Event
from app.models.event_approval import EventApproval
from app.schemas.approval import ApprovalActionRequest, ApprovalOut
from app.services.approval_service import process_approval_action

router = APIRouter()


@router.get("/pending")
async def pending_approvals(
    current_user: User = Depends(require_roles(
        "associate_dean", "director", "club_coordinator", "super_admin"
    )),
    db: AsyncSession = Depends(get_db),
):
    """Return events pending the current user's action."""
    if current_user.role == "associate_dean":
        target_status = "pending_associate_dean"
        query = select(Event).where(Event.status == target_status)
        if current_user.department_id:
            from app.models.club import Club
            dept_clubs = select(Club.id).where(Club.department_id == current_user.department_id)
            query = query.where(Event.club_id.in_(dept_clubs.scalar_subquery()))

    elif current_user.role == "director":
        query = select(Event).where(Event.status == "pending_director")

    elif current_user.role == "club_coordinator":
        # Collaborative events where this coordinator has not yet voted
        voted_event_ids = select(EventApproval.event_id).where(
            EventApproval.approver_id == current_user.id,
            EventApproval.is_parallel == True,  # noqa: E712
        )
        query = select(Event).where(
            Event.status == "pending_coordinator_parallel",
            Event.id.not_in(voted_event_ids),
            or_(
                Event.created_by == current_user.id,
                Event.club_id == current_user.club_id,
            ),
        )

    else:
        # super_admin sees all pending
        query = select(Event).where(
            Event.status.in_([
                "pending_associate_dean",
                "pending_coordinator_parallel",
                "pending_director",
            ])
        )

    result = await db.execute(query.order_by(Event.created_at.asc()))
    events = result.scalars().all()
    return [
        {
            "id": e.id,
            "title": e.title,
            "status": e.status,
            "club_id": e.club_id,
            "start_datetime": e.start_datetime,
            "created_by": e.created_by,
            "created_at": e.created_at,
        }
        for e in events
    ]


@router.post("/{event_id}/action")
async def approval_action(
    event_id: int,
    body: ApprovalActionRequest,
    current_user: User = Depends(require_roles(
        "associate_dean", "director", "club_coordinator", "super_admin"
    )),
    db: AsyncSession = Depends(get_db),
):
    """Take an approval action (approve / reject / suggest_changes)."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    valid_actions = {"approved", "rejected", "suggested_changes"}
    if body.action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Must be one of: {valid_actions}",
        )

    await process_approval_action(
        db=db,
        event=event,
        approver=current_user,
        action=body.action,
        remarks=body.remarks,
        venue_clash_override=body.venue_clash_override,
        venue_clash_override_reason=body.venue_clash_override_reason,
    )

    return {"message": f"Action '{body.action}' recorded", "event_status": event.status}


@router.get("/{event_id}/history", response_model=List[ApprovalOut])
async def approval_history(
    event_id: int,
    current_user: User = Depends(require_roles(
        "super_admin", "director", "associate_dean", "club_coordinator"
    )),
    db: AsyncSession = Depends(get_db),
):
    """Get the full approval chain history for an event."""
    result = await db.execute(
        select(EventApproval)
        .where(EventApproval.event_id == event_id)
        .order_by(EventApproval.sequence_order, EventApproval.actioned_at)
    )
    return result.scalars().all()
