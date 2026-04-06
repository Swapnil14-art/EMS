"""
Core approval workflow business logic.
Called from the approvals router.
"""
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.event import Event, EventCollaboratingClub
from app.models.event_approval import EventApproval
from app.models.user import User
from app.services.email_service import (
    notify_event_approved_by_director,
    notify_event_rejected,
    notify_suggest_changes,
    notify_pending_director,
)


async def process_approval_action(
    db: AsyncSession,
    event: Event,
    approver: User,
    action: str,
    remarks: str | None,
    venue_clash_override: bool = False,
    venue_clash_override_reason: str | None = None,
):
    """Main approval dispatch function."""

    if action in ("rejected", "suggested_changes") and not remarks:
        raise HTTPException(
            status_code=400,
            detail="Remarks are mandatory for rejection or suggest changes.",
        )

    if venue_clash_override and not venue_clash_override_reason:
        raise HTTPException(
            status_code=400,
            detail="Override reason is required when overriding venue clash.",
        )

    now = datetime.now(timezone.utc)

    effective_role = approver.role
    if effective_role == "super_admin":
        if event.status == "pending_associate_dean":
            effective_role = "associate_dean"
        elif event.status == "pending_director":
            effective_role = "director"
        elif event.status == "pending_coordinator_parallel":
            effective_role = "club_coordinator"

    if effective_role == "associate_dean":
        if event.status != "pending_associate_dean":
            raise HTTPException(
                status_code=400,
                detail="Event is not pending Associate Dean review.",
            )
        await _record_approval(
            db, event, approver, action, remarks,
            venue_clash_override, venue_clash_override_reason, sequence_order=2,
        )
        if action == "approved":
            event.status = "pending_director"
            # Notify director
            director_result = await db.execute(
                select(User).where(User.role == "director", User.status == "active")
            )
            directors = director_result.scalars().all()
            for director in directors:
                notify_pending_director(event, director)
        elif action == "rejected":
            event.status = "rejected"
            await _notify_organizers(event, db, action, remarks, approver.role)
        elif action == "suggested_changes":
            event.status = "suggested_changes"
            await _notify_organizers(event, db, action, remarks, effective_role)

    elif effective_role == "director":
        if event.status != "pending_director":
            raise HTTPException(
                status_code=400,
                detail="Event is not pending Director review.",
            )
        await _record_approval(
            db, event, approver, action, remarks,
            venue_clash_override, venue_clash_override_reason, sequence_order=3,
        )
        if action == "approved":
            event.status = "approved"
            creator = await db.get(User, event.created_by)
            if creator:
                notify_event_approved_by_director(event, creator)
        elif action == "rejected":
            event.status = "rejected"
            await _notify_organizers(event, db, action, remarks, approver.role)
        elif action == "suggested_changes":
            event.status = "suggested_changes"
            await _notify_organizers(event, db, action, remarks, effective_role)

    elif effective_role == "club_coordinator":
        if event.status != "pending_coordinator_parallel":
            raise HTTPException(
                status_code=400,
                detail="Event is not in parallel coordinator review.",
            )
        await _handle_parallel_coordinator_approval(
            db, event, approver, action, remarks, now,
            venue_clash_override, venue_clash_override_reason,
        )

    event.updated_at = now
    await db.commit()


async def _record_approval(
    db, event, approver, action, remarks, override, override_reason,
    sequence_order, is_parallel=False, parallel_group=None,
):
    approval = EventApproval(
        event_id=event.id,
        approver_id=approver.id,
        role_at_approval=approver.role,
        sequence_order=sequence_order,
        is_parallel=is_parallel,
        parallel_group=parallel_group,
        action=action,
        remarks=remarks,
        venue_clash_override=override,
        venue_clash_override_reason=override_reason,
        actioned_at=datetime.now(timezone.utc),
    )
    db.add(approval)


async def _notify_organizers(event, db, action, remarks, by_role):
    creator = await db.get(User, event.created_by)
    recipients = [creator] if creator else []
    if action == "rejected":
        notify_event_rejected(event, recipients, remarks, by_role)
    elif action == "suggested_changes":
        notify_suggest_changes(event, recipients, remarks, by_role)


async def _handle_parallel_coordinator_approval(
    db, event, approver, action, remarks, now,
    venue_clash_override, venue_clash_override_reason,
):
    """Handle collaborative event coordinator parallel voting."""
    await _record_approval(
        db, event, approver, action, remarks,
        venue_clash_override, venue_clash_override_reason,
        sequence_order=1, is_parallel=True, parallel_group=1,
    )

    if action in ("rejected", "suggested_changes"):
        event.status = "rejected" if action == "rejected" else "suggested_changes"
        await _notify_organizers(event, db, action, remarks, approver.role)
        return

    # Check if ALL coordinators have now approved
    collab_result = await db.execute(
        select(EventCollaboratingClub).where(EventCollaboratingClub.event_id == event.id)
    )
    collab_clubs = collab_result.scalars().all()
    expected_count = len(collab_clubs) + 1  # +1 for creator's club

    approval_result = await db.execute(
        select(EventApproval).where(
            EventApproval.event_id == event.id,
            EventApproval.is_parallel == True,   # noqa: E712
            EventApproval.action == "approved",
        )
    )
    approved_count = len(approval_result.scalars().all())

    if approved_count >= expected_count:
        event.status = "pending_associate_dean"
        # Notify associate_dean
        if event.club and event.club.department_id:
            dean_result = await db.execute(
                select(User).where(
                    User.role == "associate_dean",
                    User.department_id == event.club.department_id,
                    User.status == "active",
                )
            )
            deans = dean_result.scalars().all()
            from app.services.email_service import notify_event_submitted
            for dean in deans:
                notify_event_submitted(event, dean)
