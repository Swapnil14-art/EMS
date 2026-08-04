"""add_level_to_clubs

Revision ID: f56789abcde0
Revises: f4589e384f85
Create Date: 2026-08-02

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f56789abcde0'
down_revision = 'e0f1a2b3c4d5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'clubs',
        sa.Column('level', sa.String(length=50), nullable=False, server_default='department')
    )


def downgrade() -> None:
    op.drop_column('clubs', 'level')
