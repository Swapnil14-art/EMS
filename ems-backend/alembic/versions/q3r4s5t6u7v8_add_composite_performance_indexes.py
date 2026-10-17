"""add composite performance indexes

Revision ID: q3r4s5t6u7v8
Revises: p2q3r4s5t6u7
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "q3r4s5t6u7v8"
down_revision: Union[str, None] = "p2q3r4s5t6u7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Composite index for department and status lookup
    op.create_index(
        "ix_events_dept_status",
        "events",
        ["school_department", "status"],
        if_not_exists=True,
    )

    # 2. Composite index on status and start_datetime
    op.create_index(
        "ix_events_status_start_dt",
        "events",
        ["status", "start_datetime"],
        if_not_exists=True,
    )

    # 3. Composite index on registrations
    op.create_index(
        "ix_registrations_event_user",
        "event_registrations",
        ["event_id", "student_id"],
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index("ix_registrations_event_user", table_name="event_registrations", if_exists=True)
    op.drop_index("ix_events_status_start_dt", table_name="events", if_exists=True)
    op.drop_index("ix_events_dept_status", table_name="events", if_exists=True)
