"""add faculty involvement and registration audience

Revision ID: m8n9o0p1q2r3
Revises: l7m8n9o0p1q2
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "m8n9o0p1q2r3"
down_revision: Union[str, None] = "l7m8n9o0p1q2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("events", sa.Column("faculty_involved_emails", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("events", sa.Column("student_registration_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("events", sa.Column("faculty_registration_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("events", "faculty_registration_enabled")
    op.drop_column("events", "student_registration_enabled")
    op.drop_column("events", "faculty_involved_emails")
