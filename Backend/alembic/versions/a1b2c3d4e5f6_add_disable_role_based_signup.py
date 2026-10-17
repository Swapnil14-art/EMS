"""add disable_role_based_signup to system_config

Revision ID: a1b2c3d4e5f6
Revises: f4589e384f85
Create Date: 2026-04-05 05:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f4589e384f85'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('system_config', sa.Column('disable_role_based_signup', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade() -> None:
    op.drop_column('system_config', 'disable_role_based_signup')
