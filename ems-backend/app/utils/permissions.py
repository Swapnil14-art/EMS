from app.models.user import User
from app.models.event import Event


def can_edit_event(user: User, event: Event, collaborating_club_ids: list = None) -> bool:
    """Check if user can edit the event based on status and role."""
    if user.role == "super_admin":
        return True
    if user.role == "club_coordinator":
        is_owner = (event.created_by == user.id or user.club_id == event.club_id)
        is_collaborator = bool(collaborating_club_ids and user.club_id in collaborating_club_ids)
        if not is_owner and not is_collaborator:
            return False
        editable_statuses = [
            "draft",
            "pending_associate_dean",
            "pending_coordinator_parallel",
            "pending_director",
            "suggested_changes",
            "approved",
            "ongoing",
        ]
        return event.status in editable_statuses
    return False


def can_cancel_event(user: User, event: Event, collaborating_club_ids: list = None) -> bool:
    """Check if user can cancel the event."""
    if event.status in ["archived", "completed"]:
        return False
    if user.role in ["director", "super_admin"]:
        return True
    if (
        user.role == "associate_dean"
        and event.club
        and event.club.department_id == user.department_id
    ):
        return True
    if user.role == "club_coordinator" and (
        event.created_by == user.id or event.club_id == user.club_id
        or (collaborating_club_ids and user.club_id in collaborating_club_ids)
    ):
        return True
    return False


from typing import Optional

def can_view_internal_docs(user: Optional[User]) -> bool:
    if not user:
        return False
    if user.role in ["super_admin", "director", "associate_dean", "club_coordinator"]:
        return True
    if user.role == "additional":
        from app.utils.additional_perms import has_perm
        return has_perm(user, "view_documents")
    return False



def can_view_event_for_student(user: User, event: Event) -> bool:
    """Student visibility check."""
    if event.status not in ["approved", "ongoing", "completed", "archived"]:
        return False
    if event.target_audience == "college_wide":
        return True
    dept_code = user.department.code.lower() if user.department else ""
    return event.target_audience == dept_code
