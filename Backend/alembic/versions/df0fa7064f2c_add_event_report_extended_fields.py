"""add_event_report_extended_fields

Revision ID: df0fa7064f2c
Revises: e9d28365c211
Create Date: 2026-04-22 00:57:32.361317

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df0fa7064f2c'
down_revision: Union[str, None] = 'e9d28365c211'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to event_reports table
    op.add_column('event_reports', sa.Column('student_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('event_reports', sa.Column('faculty_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('event_reports', sa.Column('external_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('event_reports', sa.Column('program_type', sa.String(length=100), nullable=True))
    op.add_column('event_reports', sa.Column('objective', sa.String(length=200), nullable=True))
    op.add_column('event_reports', sa.Column('learning_benefit', sa.String(length=300), nullable=True))
    op.add_column('event_reports', sa.Column('guest_speakers', sa.JSON(), nullable=True))
    op.add_column('event_reports', sa.Column('faculty_coordinators', sa.JSON(), nullable=True))
    op.add_column('event_reports', sa.Column('student_coordinators', sa.JSON(), nullable=True))
    op.add_column('event_reports', sa.Column('social_pamphlet', sa.JSON(), nullable=True))
    op.add_column('event_reports', sa.Column('social_video', sa.JSON(), nullable=True))
    op.add_column('event_reports', sa.Column('speaker_background', sa.Text(), nullable=True))
    op.add_column('event_reports', sa.Column('session_report', sa.Text(), nullable=True))
    op.add_column('event_reports', sa.Column('key_outcomes', sa.JSON(), nullable=True))
    op.add_column('event_reports', sa.Column('conclusion', sa.Text(), nullable=True))
    op.add_column('event_reports', sa.Column('mode_of_delivery', sa.String(length=20), nullable=True))
    op.add_column('event_reports', sa.Column('flier_path', sa.Text(), nullable=True))

    # Drop participant_count column if it exists as a real column
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('event_reports')]
    if 'participant_count' in columns:
        op.drop_column('event_reports', 'participant_count')


def downgrade() -> None:
    # Remove the new columns
    op.drop_column('event_reports', 'flier_path')
    op.drop_column('event_reports', 'mode_of_delivery')
    op.drop_column('event_reports', 'conclusion')
    op.drop_column('event_reports', 'key_outcomes')
    op.drop_column('event_reports', 'session_report')
    op.drop_column('event_reports', 'speaker_background')
    op.drop_column('event_reports', 'social_video')
    op.drop_column('event_reports', 'social_pamphlet')
    op.drop_column('event_reports', 'student_coordinators')
    op.drop_column('event_reports', 'faculty_coordinators')
    op.drop_column('event_reports', 'guest_speakers')
    op.drop_column('event_reports', 'learning_benefit')
    op.drop_column('event_reports', 'objective')
    op.drop_column('event_reports', 'program_type')
    op.drop_column('event_reports', 'external_count')
    op.drop_column('event_reports', 'faculty_count')
    op.drop_column('event_reports', 'student_count')

    # Restore participant_count column if it was dropped
    # Note: We can't restore the data, only the column structure
    op.add_column('event_reports', sa.Column('participant_count', sa.Integer(), nullable=True))
