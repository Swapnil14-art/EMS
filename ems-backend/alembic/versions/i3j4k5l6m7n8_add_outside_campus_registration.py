"""add_outside_campus_registration

Revision ID: i3j4k5l6m7n8
Revises: h2i3j4k5l6m7
Create Date: 2026-08-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'i3j4k5l6m7n8'
down_revision: Union[str, None] = 'h2i3j4k5l6m7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Event: outside campus registration toggle
    op.add_column('events', sa.Column('outside_campus_registration', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    # EventRegistration: participation_type column
    op.add_column('event_registrations', sa.Column('participation_type', sa.String(20), nullable=False, server_default=sa.text("'in_campus'")))

    # EventRegistration: make student_id nullable for visitor registrations
    op.alter_column('event_registrations', 'student_id', existing_type=sa.Integer(), nullable=True)

    # EventRegistration: visitor-specific fields
    op.add_column('event_registrations', sa.Column('visitor_name', sa.String(255), nullable=True))
    op.add_column('event_registrations', sa.Column('visitor_email', sa.String(255), nullable=True))
    op.add_column('event_registrations', sa.Column('visitor_phone', sa.String(30), nullable=True))
    op.add_column('event_registrations', sa.Column('visitor_qualification', sa.String(255), nullable=True))
    op.add_column('event_registrations', sa.Column('visitor_school_college', sa.String(255), nullable=True))

    # Unique constraint to prevent duplicate visitor email per event
    op.create_unique_constraint('uq_event_visitor_email', 'event_registrations', ['event_id', 'visitor_email'])


def downgrade() -> None:
    op.drop_constraint('uq_event_visitor_email', 'event_registrations', type_='unique')
    op.drop_column('event_registrations', 'visitor_school_college')
    op.drop_column('event_registrations', 'visitor_qualification')
    op.drop_column('event_registrations', 'visitor_phone')
    op.drop_column('event_registrations', 'visitor_email')
    op.drop_column('event_registrations', 'visitor_name')
    op.alter_column('event_registrations', 'student_id', existing_type=sa.Integer(), nullable=False)
    op.drop_column('event_registrations', 'participation_type')
    op.drop_column('events', 'outside_campus_registration')
