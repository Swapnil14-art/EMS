"""
Computes the diff between two event snapshots (JSONB fields).
Used by approvers to see what changed in post-Director edits.
"""
from typing import Dict, Any


def compute_diff(
    old_snapshot: Dict[str, Any], new_snapshot: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Returns only the fields that changed.
    Format: { "field_name": { "old": ..., "new": ... } }
    """
    changes = {}
    all_keys = set(old_snapshot.keys()) | set(new_snapshot.keys())

    for key in all_keys:
        old_val = old_snapshot.get(key)
        new_val = new_snapshot.get(key)
        if old_val != new_val:
            changes[key] = {"old": old_val, "new": new_val}

    return changes


def take_event_snapshot(event) -> dict:
    """
    Capture all relevant event fields as a plain dict for JSONB storage.
    Call this BEFORE saving an edit.
    """
    return {
        "title": event.title,
        "event_type": event.event_type,
        "school_department": event.school_department,
        "event_incharge_name": event.event_incharge_name,
        "event_incharge_contact": event.event_incharge_contact,
        "target_audience": event.target_audience,
        "start_datetime": event.start_datetime.isoformat() if event.start_datetime else None,
        "end_datetime": event.end_datetime.isoformat() if event.end_datetime else None,
        "registration_start_datetime": (
            event.registration_start_datetime.isoformat() if event.registration_start_datetime else None
        ),
        "registration_deadline": (
            event.registration_deadline.isoformat() if event.registration_deadline else None
        ),
        "venue_id": event.venue_id,
        "venue_custom": event.venue_custom,
        "venue_type": event.venue_type,
        "seating_arrangement": event.seating_arrangement,
        "budget": str(event.budget) if event.budget else None,
        "it_projector": event.it_projector,
        "it_audio": event.it_audio,
        "it_wifi": event.it_wifi,
        "it_laptop": event.it_laptop,
        "food_items": event.food_items,
        "pax_count": event.pax_count,
        "transport": event.transport,
        "security": event.security,
        "printing": event.printing,
        "volunteers": event.volunteers,
        "comments": event.comments,
        "is_sponsored": event.is_sponsored,
        "is_collaborative": event.is_collaborative,
        "registration_accepted": event.registration_accepted,
        "outside_campus_registration": event.outside_campus_registration,
    }
