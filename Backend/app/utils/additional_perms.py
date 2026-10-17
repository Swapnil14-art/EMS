"""
Permission catalog and helper utilities for the 'additional' role.
"""
from typing import List

# All valid permission codes mapped to human-readable labels
PERMISSION_CATALOG: dict[str, str] = {
    "registration":        "Registration — Register for events enabled for the selected coordinator type",
    "view_events":         "View Events — Browse the public event list",
    "view_event_details":  "View Event Details — Open full event detail pages",
    "view_event_status":   "View Approval Status — See approval history & current step",
    "view_documents":      "View Documents — Access event documents & external links",
    "view_reports":        "View Reports — Download post-event reports",
    "view_rnd_reports":    "View RnD Reports — Download RnD reports",
    "submit_reports":      "Submit Reports — Upload/submit post-event reports",
    "submit_rnd_reports":  "Submit RnD Reports — Upload/submit RnD reports",
    "manage_permissions":  "Manage Permissions — Grant/revoke perms for other Additional users",
}

VALID_PERMISSIONS: set[str] = set(PERMISSION_CATALOG.keys())


def has_perm(user, perm: str) -> bool:
    """Return True if user is allowed to perform the action.

    - super_admin always returns True (bypass)
    - For 'additional' role, checks extra_permissions list
    - All other fixed roles return True (they have inherent access)
    """
    if user.role == "super_admin":
        return True
    if user.role == "additional":
        perms: List[str] = user.extra_permissions or []
        return perm in perms
    # Fixed roles (director, associate_dean, club_coordinator, student) are handled
    # by their own require_roles guards; they never reach additional perm checks.
    return True


def can_manage_permissions(user) -> bool:
    """True if the user may view/edit Additional user permissions."""
    if user.role == "super_admin":
        return True
    if user.role == "additional":
        return has_perm(user, "manage_permissions")
    return False
