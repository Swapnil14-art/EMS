"""
Core approval workflow business logic.
Called from the approvals router.
"""
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sa_delete, or_, func

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
        is_cw = await _is_college_wide_event(db, event)

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
            from app.models.club import Club

            if event.club_id:
                creator_club = await db.get(Club, event.club_id)
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

    # Check each department to see if any of its deans have approved
    for dept_id in dept_ids:
        dept_deans_result = await db.execute(
            select(User.id).where(
                User.role == "associate_dean",
                User.department_id == dept_id,
                User.status == "active",
            )
        )
        dept_dean_ids = [u_id for u_id in dept_deans_result.scalars().all()]
        # If this department has deans configured, at least one must have approved
        if dept_dean_ids:
            if not any(d_id in approved_dean_ids for d_id in dept_dean_ids):
                return False
        # If a department has no deans configured in DB, skip it so workflow isn't blocked

    return True


async def _get_all_collab_coordinators(db, event) -> list:
    """Get User objects for all coordinators involved: creator + collaborating club coordinators."""
    recipients = []
    seen_ids = set()

    creator = await db.get(User, event.created_by)
    if creator:
        recipients.append(creator)
        seen_ids.add(creator.id)

    collab_result = await db.execute(
        select(EventCollaboratingClub).where(EventCollaboratingClub.event_id == event.id)
    )
    collab_clubs = collab_result.scalars().all()

    from app.models.club import Club
    for collab in collab_clubs:
        if collab.club_id:
            collab_club = await db.get(Club, collab.club_id)
            if collab_club and collab_club.coordinator_id:
                if collab_club.coordinator_id not in seen_ids:
                    coord = await db.get(User, collab_club.coordinator_id)
                    if coord:
                        recipients.append(coord)
                        seen_ids.add(coord.id)

    return recipients


async def clear_approval_records(db, event_id: int):
    """Clear all EventApproval records for an event.
    Called when the approval chain restarts (e.g., after an edit)."""
    await db.execute(
        sa_delete(EventApproval).where(EventApproval.event_id == event_id)
    )


async def _is_college_wide_event(db: AsyncSession, event: Event) -> bool:
    """Helper to check if an event belongs to a College-Wide club or targets College-Wide."""
    from app.models.club import Club
    from app.models.user import User

    club = None
    if event.club_id:
        club = await db.get(Club, event.club_id)
    elif event.created_by:
        creator = await db.get(User, event.created_by)
        if creator and creator.club_id:
            club = await db.get(Club, creator.club_id)

    if club:
        level = str(getattr(club, "level", "department") or "department").strip().lower()
        if level in ("college_wide", "college") or club.department_id is None:
            return True

    if event.departments_involved:
        for d in event.departments_involved:
            du = str(d).strip().upper()
            if du in ("COLLEGE WIDE", "COLLEGE_WIDE", "ALL", "ALL DEPARTMENTS", "COLLEGE"):
                return True
            if "COLLEGE WIDE" in du or "COLLEGE-WIDE" in du:
                return True

    sd = str(event.school_department or "").strip().upper()
    if sd in ("COLLEGE WIDE", "COLLEGE_WIDE", "COLLEGE", "ALL", "ALL DEPARTMENTS"):
        return True
    if "COLLEGE WIDE" in sd or "COLLEGE-WIDE" in sd:
        return True

    ta = str(event.target_audience or "").strip().upper()
    if ta in ("COLLEGE_WIDE", "COLLEGE WIDE", "COLLEGE", "ALL", "ALL DEPARTMENTS"):
        return True
    if "COLLEGE WIDE" in ta or "COLLEGE-WIDE" in ta:
        return True

    return False


async def set_non_collab_pending_status(db: AsyncSession, event: Event):
    """Set next pending status for a non-collaborative event submission or edit.
    For college-wide clubs or events with COLLEGE WIDE department involved: goes directly to pending_director and notifies Director.
    For department clubs: goes to pending_associate_dean and notifies Associate Deans."""
    from app.models.club import Club
    from app.models.department import Department
    club = await db.get(Club, event.club_id) if event.club_id else None

    is_college_wide_event = await _is_college_wide_event(db, event)

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
        target_dept_ids = set()
        if club and club.department_id:
            target_dept_ids.add(club.department_id)

        # Load all departments for robust matching
        all_depts_res = await db.execute(select(Department))
        all_depts = all_depts_res.scalars().all()

        text_candidates = []
        if event.departments_involved:
            for d in event.departments_involved:
                text_candidates.append(str(d).strip())

        if event.school_department:
            for part in str(event.school_department).split(","):
                text_candidates.append(part.strip())

        if event.target_audience:
            for part in str(event.target_audience).split(","):
                text_candidates.append(part.strip())

        for cand in text_candidates:
            cand_lower = cand.lower()
            if not cand_lower or cand_lower in ("multiple", "none", "all", "college wide", "college-wide", "college_wide"):
                continue
            for dept in all_depts:
                dept_name_lower = (dept.name or "").lower()
                dept_code_lower = (dept.code or "").lower()
                if (
                    cand_lower == dept_name_lower
                    or cand_lower == dept_code_lower
                    or (cand_lower in dept_name_lower and len(cand_lower) >= 3)
                    or (dept_name_lower in cand_lower and len(dept_name_lower) >= 3)
                    or (dept_code_lower and dept_code_lower in cand_lower)
                ):
                    target_dept_ids.add(dept.id)

        # If still no target dept and creator has a department, consider it as well
        if not target_dept_ids and event.created_by:
            creator = await db.get(User, event.created_by)
            if creator and creator.department_id:
                target_dept_ids.add(creator.department_id)

        if target_dept_ids:
            dean_result = await db.execute(
                select(User).where(
                    User.role == "associate_dean",
                    User.department_id.in_(target_dept_ids),
                    User.status == "active",
                )
            )
            deans = dean_result.scalars().all()
        else:
            dean_result = await db.execute(
                select(User).where(
                    User.role == "associate_dean",
                    User.status == "active",
                )
            )
            deans = dean_result.scalars().all()

        from app.services.email_service import notify_event_submitted
        for dean in deans:
            notify_event_submitted(event, dean)
