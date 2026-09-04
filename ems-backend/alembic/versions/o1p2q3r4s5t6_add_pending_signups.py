"""add pending signups

Revision ID: o1p2q3r4s5t6
Revises: n9o0p1q2r3s4
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "o1p2q3r4s5t6"
down_revision: Union[str, None] = "n9o0p1q2r3s4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pending_signups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("sent_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("last_sent_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_pending_signups_email", "pending_signups", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_pending_signups_email", table_name="pending_signups")
    op.drop_table("pending_signups")
