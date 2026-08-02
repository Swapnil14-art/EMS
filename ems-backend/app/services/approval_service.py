"""
Core approval workflow business logic.
Called from the approvals router.
"""
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sa_delete

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
        # Prevent duplicate approval — check if this dean already approved this event
        existing_approval = await db.execute(
            select(EventApproval).where(
                EventApproval.event_id == event.id,
                EventApproval.approver_id == approver.id,
                EventApproval.sequence_order == 2,  # associate_dean sequence
            )
        )
        if existing_approval.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="You have already reviewed this event. Waiting for other reviewers.",
            )
        await _record_approval(
            db, event, approver, action, remarks,
            venue_clash_override, venue_clash_override_reason, sequence_order=2,
        )
        # Flush so the new approval row is visible to the subsequent query
        await db.flush()
        if action == "approved":
            # For collaborative events, check if ALL required deans have approved
            all_deans_done = True
            if event.is_collaborative:
                all_deans_done = await _check_all_deans_approved(db, event)

            if all_deans_done:
                event.status = "pending_director"
                # Notify director
                director_result = await db.execute(
                    select(User).where(User.role == "director", User.status == "active")
                )
                directors = director_result.scalars().all()
                for director in directors:
                    notify_pending_director(event, director)
            # else: stays pending_associate_dean, waiting for remaining deans
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
            # Notify ALL involved coordinators (creator + collaborators)
            all_coordinators = await _get_all_collab_coordinators(db, event)
            if all_coordinators:
                for coord in all_coordinators:
                    notify_event_approved_by_director(event, coord)
            else:
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
    """Notify all organizers: creator + all collaborating club coordinators."""
    if event.is_collaborative:
        recipients = await _get_all_collab_coordinators(db, event)
    else:
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

    # Check if ALL collaborating coordinators have now approved
    collab_result = await db.execute(
        select(EventCollaboratingClub).where(EventCollaboratingClub.event_id == event.id)
    )
    collab_clubs = collab_result.scalars().all()
    # Only collaborating club coordinators need to approve
    # (the creator already approved by submitting the event)
    expected_count = len(collab_clubs)

    approval_result = await db.execute(
        select(EventApproval).where(
            EventApproval.event_id == event.id,
            EventApproval.is_parallel == True,   # noqa: E712
            EventApproval.action == "approved",
        )
    )
    approved_count = len(approval_result.scalars().all())

    if approved_count >= expected_count:
        from app.models.club import Club
        creator_club = await db.get(Club, event.club_id) if event.club_id else None

        is_cw = False
        if creator_club and getattr(creator_club, "level", "department") == "college_wide":
            is_cw = True
        elif event.departments_involved:
            depts_upper = [str(d).strip().upper() for d in event.departments_involved]
            if "COLLEGE WIDE" in depts_upper or "COLLEGE_WIDE" in depts_upper:
                is_cw = True

        if is_cw:
            event.status = "pending_director"
            director_result = await db.execute(
                select(User).where(User.role == "director", User.status == "active")
            )
            directors = director_result.scalars().all()
            for director in directors:
                notify_pending_director(event, director)
        else:
            event.status = "pending_associate_dean"
            # Collect ALL unique department IDs from creator's club + collaborating clubs
            dept_ids = set()

            if creator_club and creator_club.department_id:
                dept_ids.add(creator_club.department_id)

            for collab in collab_clubs:
                if collab.club_id:
                    collab_club = await db.get(Club, collab.club_id)
                    if collab_club and collab_club.department_id:
                        dept_ids.add(collab_club.department_id)

            # Notify Associate Deans for ALL involved departments
            if dept_ids:
                from app.services.email_service import notify_event_submitted
                dean_result = await db.execute(
                    select(User).where(
                        User.role == "associate_dean",
                        User.department_id.in_(dept_ids),
                        User.status == "active",
                    )
                )
                deans = dean_result.scalars().all()
                for dean in deans:
                    notify_event_submitted(event, dean)


async def _check_all_deans_approved(db, event) -> bool:
    """For collaborative events, check if ALL required department deans have approved.
    Returns True if every involved department has at least one dean approval.
    Only the RESPECTIVE deans (departments of involved clubs) are required."""
    from app.models.club import Club

    # Collect all required department IDs
    dept_ids = set()
    if event.club_id:
        creator_club = await db.get(Club, event.club_id)
        if creator_club and creator_club.department_id:
            dept_ids.add(creator_club.department_id)

    collab_result = await db.execute(
        select(EventCollaboratingClub).where(EventCollaboratingClub.event_id == event.id)
    )
    collab_clubs = collab_result.scalars().all()
    for collab in collab_clubs:
        if collab.club_id:
            collab_club = await db.get(Club, collab.club_id)
            if collab_club and collab_club.department_id:
                dept_ids.add(collab_club.department_id)

    if not dept_ids:
        return True  # No departments to check

    # Get all dean approvals for this event
    dean_approvals = await db.execute(
        select(EventApproval).where(
            EventApproval.event_id == event.id,
            EventApproval.sequence_order == 2,  # associate_dean sequence
            EventApproval.action == "approved",
        )
    )
    approved_dean_ids = [a.approver_id for a in dean_approvals.scalars().all()]

    # Check which departments have an approved dean
    if not approved_dean_ids:
        return False

    approved_deans = await db.execute(
        select(User).where(User.id.in_(approved_dean_ids))
    )
    approved_dept_ids = {d.department_id for d in approved_deans.scalars().all() if d.department_id}

    # All required departments must be covered
    return dept_ids.issubset(approved_dept_ids)


async def _get_all_collab_coordinators(db, event) -> list:
    """Get all coordinator Users for a collaborative event:
    creator + coordinators of all collaborating clubs.
    Returns deduplicated list of User objects."""
    from app.models.club import Club

    user_ids = set()
    users = []

    # Add creator
    if event.created_by:
        user_ids.add(event.created_by)

    # Add creator's club coordinator (if different from creator)
    if event.club_id:
        creator_club = await db.get(Club, event.club_id)
        if creator_club and creator_club.coordinator_id:
            user_ids.add(creator_club.coordinator_id)

    # Add all collaborating club coordinators
    collab_result = await db.execute(
        select(EventCollaboratingClub).where(EventCollaboratingClub.event_id == event.id)
    )
    collab_clubs = collab_result.scalars().all()
    for collab in collab_clubs:
        if collab.club_id:
            club = await db.get(Club, collab.club_id)
            if club and club.coordinator_id:
                user_ids.add(club.coordinator_id)

    # Fetch all User objects
    if user_ids:
        result = await db.execute(
            select(User).where(User.id.in_(user_ids), User.status == "active")
        )
        users = result.scalars().all()

    return users


async def clear_approval_records(db, event_id: int):
    """Clear all EventApproval records for an event.
    Called when the approval chain restarts (e.g., after an edit)."""
    await db.execute(
        sa_delete(EventApproval).where(EventApproval.event_id == event_id)
    )


async def set_non_collab_pending_status(db: AsyncSession, event: Event):
    """Set next pending status for a non-collaborative event submission or edit.
    For college-wide clubs or events with COLLEGE WIDE department involved: goes directly to pending_director and notifies Director.
    For department clubs: goes to pending_associate_dean and notifies Associate Deans."""
    from app.models.club import Club
    club = await db.get(Club, event.club_id) if event.club_id else None

    is_college_wide_event = False
    if club and getattr(club, "level", "department") == "college_wide":
        is_college_wide_event = True
    elif event.departments_involved:
        depts_upper = [str(d).strip().upper() for d in event.departments_involved]
        if "COLLEGE WIDE" in depts_upper or "COLLEGE_WIDE" in depts_upper:
            is_college_wide_event = True

    if is_college_wide_event:
        event.status = "pending_director"
        director_result = await db.execute(
            select(User).where(User.role == "director", User.status == "active")
        )
        directors = director_result.scalars().all()
        for director in directors:
            notify_pending_director(event, director)
    else:
        event.status = "pending_associate_dean"
        if club and club.department_id:
            dean_result = await db.execute(
                select(User).where(
                    User.role == "associate_dean",
                    User.department_id == club.department_id,
                    User.status == "active",
                )
            )
            deans = dean_result.scalars().all()
            from app.services.email_service import notify_event_submitted
            for dean in deans:
                notify_event_submitted(event, dean)
