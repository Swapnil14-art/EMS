"""add indexes for event browse and ownership queries

Revision ID: e0f1a2b3c4d5
Revises: c7a787bade2a
"""
from typing import Sequence, Union

from alembic import op


revision: str = "e0f1a2b3c4d5"
down_revision: Union[str, None] = "c7a787bade2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_events_status_start_datetime", "events", ["status", "start_datetime"], unique=False)
    op.create_index("ix_events_created_by_created_at", "events", ["created_by", "created_at"], unique=False)
    op.create_index("ix_events_club_id_created_at", "events", ["club_id", "created_at"], unique=False)
    op.create_index("ix_event_coordinators_user_id", "event_coordinators", ["user_id"], unique=False)
    op.create_index("ix_event_collaborating_clubs_club_id", "event_collaborating_clubs", ["club_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_event_collaborating_clubs_club_id", table_name="event_collaborating_clubs")
    op.drop_index("ix_event_coordinators_user_id", table_name="event_coordinators")
    op.drop_index("ix_events_club_id_created_at", table_name="events")
    op.drop_index("ix_events_created_by_created_at", table_name="events")
    op.drop_index("ix_events_status_start_datetime", table_name="events")
