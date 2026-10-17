"""add coordinator type to additional users

Revision ID: n9o0p1q2r3s4
Revises: m8n9o0p1q2r3
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "n9o0p1q2r3s4"
down_revision: Union[str, None] = "m8n9o0p1q2r3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("coordinator_type", sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "coordinator_type")
