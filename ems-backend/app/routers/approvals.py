from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.event import Event, EventCollaboratingClub
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
        
        # Exclude events this dean has already voted on
        already_voted = select(EventApproval.event_id).where(
            EventApproval.approver_id == current_user.id,
            EventApproval.sequence_order == 2,  # associate_dean sequence
        )
        
        query = select(Event).where(
            Event.status == target_status,
            Event.id.not_in(already_voted),
        )
        if current_user.department_id:
            from app.models.club import Club
            dept_clubs = select(Club.id).where(Club.department_id == current_user.department_id)
            dept_code = current_user.department.code.strip().lower() if current_user.department and current_user.department.code else ""
            dept_name = current_user.department.name.strip().lower() if current_user.department and current_user.department.name else ""
            
            # Collaborative clubs from this department
            collab_match = select(EventCollaboratingClub.event_id).where(
                EventCollaboratingClub.club_id.in_(dept_clubs.scalar_subquery())
            )
            
            dept_matchers = [
                Event.club_id.in_(dept_clubs.scalar_subquery()),
                Event.id.in_(collab_match.scalar_subquery())
            ]
            if dept_code:
                dept_matchers.append(Event.school_department.ilike(f"%{dept_code}%"))
            if dept_name:
                dept_matchers.append(Event.school_department.ilike(f"%{dept_name}%"))
                
            query = query.where(or_(*dept_matchers))

    elif current_user.role == "director":
        query = select(Event).where(Event.status == "pending_director")

    elif current_user.role == "club_coordinator":
        # Collaborative events where this coordinator has not yet voted
        voted_event_ids = select(EventApproval.event_id).where(
            EventApproval.approver_id == current_user.id,
            EventApproval.is_parallel == True,  # noqa: E712
        )
        # Events where this coordinator's club is a collaborating club
        collab_event_ids = select(EventCollaboratingClub.event_id).where(
            EventCollaboratingClub.club_id == current_user.club_id,
        )
        query = select(Event).where(
            Event.status == "pending_coordinator_parallel",
            Event.id.not_in(voted_event_ids),
            or_(
                Event.created_by == current_user.id,
                Event.club_id == current_user.club_id,
                Event.id.in_(collab_event_ids),
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

    result = await db.execute(
        query
        .options(
            selectinload(Event.venue),
            selectinload(Event.club),
            selectinload(Event.collaborating_clubs),
        )
        .order_by(Event.created_at.asc())
    )
    events = result.scalars().all()

    # Batch-load creator names
    creator_ids = list({e.created_by for e in events if e.created_by})
    creators_map = {}
    if creator_ids:
        from app.models.user import User as UserModel
        cr_result = await db.execute(
            select(UserModel).where(UserModel.id.in_(creator_ids))
        )
        creators_map = {u.id: u for u in cr_result.scalars().all()}

    return [
        {
            "id": e.id,
            "title": e.title,
            "status": e.status,
            "club_id": e.club_id,
            "event_type": e.event_type,
            "is_collaborative": e.is_collaborative,
            "is_sponsored": e.is_sponsored,
            "start_datetime": e.start_datetime,
            "end_datetime": e.end_datetime,
            "venue": {"name": e.venue.name} if e.venue else None,
            "venue_custom": e.venue_custom,
            "creator": {"name": creators_map[e.created_by].name} if e.created_by in creators_map else None,
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
    event = await db.get(
        Event, event_id,
        options=[
            selectinload(Event.collaborating_clubs).selectinload(EventCollaboratingClub.club),
            selectinload(Event.club),
        ],
    )
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


@router.get("/history")
async def all_approval_history(
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_roles(
        "super_admin", "director", "associate_dean", "club_coordinator"
    )),
    db: AsyncSession = Depends(get_db),
):
    """Get the full approval history across all events for the current user."""
    query = select(EventApproval)
    
    if current_user.role != "super_admin":
        query = query.where(EventApproval.approver_id == current_user.id)
        
    query = query.where(EventApproval.action != "pending")
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.order_by(EventApproval.actioned_at.desc())
    query = query.offset((page - 1) * size).limit(size)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    data = [ApprovalOut.model_validate(item).model_dump() for item in items]
    return {"data": data, "total": total}

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
