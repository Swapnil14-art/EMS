"""add_rnd_event_fields

Revision ID: h2i3j4k5l6m7
Revises: g1h2i3j4k5l6
Create Date: 2026-08-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'h2i3j4k5l6m7'
down_revision: Union[str, None] = 'g1h2i3j4k5l6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('events', sa.Column('is_rnd_event', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('events', sa.Column('rnd_activity_theme', sa.String(255), nullable=True))
    op.add_column('events', sa.Column('rnd_prescribed_activity', sa.String(255), nullable=True))
    op.add_column('events', sa.Column('rnd_semester_quarter', sa.String(100), nullable=True))
    op.add_column('events', sa.Column('rnd_tentative_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('events', 'rnd_tentative_date')
    op.drop_column('events', 'rnd_semester_quarter')
    op.drop_column('events', 'rnd_prescribed_activity')
    op.drop_column('events', 'rnd_activity_theme')
    op.drop_column('events', 'is_rnd_event')
