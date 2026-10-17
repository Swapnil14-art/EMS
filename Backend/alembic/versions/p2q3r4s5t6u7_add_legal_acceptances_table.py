"""add legal acceptances table

Revision ID: p2q3r4s5t6u7
Revises: o1p2q3r4s5t6
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "p2q3r4s5t6u7"
down_revision: Union[str, None] = "o1p2q3r4s5t6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "legal_acceptances",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_type", sa.String(length=50), nullable=False),
        sa.Column("document_version", sa.String(length=20), nullable=False),
        sa.Column("accepted_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="accepted"),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_legal_acceptances_user_id", "legal_acceptances", ["user_id"])
    op.create_index("ix_legal_acceptances_document_type", "legal_acceptances", ["document_type"])
    op.create_index("ix_legal_acceptances_user_doc", "legal_acceptances", ["user_id", "document_type"])


def downgrade() -> None:
    op.drop_index("ix_legal_acceptances_user_doc", table_name="legal_acceptances")
    op.drop_index("ix_legal_acceptances_document_type", table_name="legal_acceptances")
    op.drop_index("ix_legal_acceptances_user_id", table_name="legal_acceptances")
    op.drop_table("legal_acceptances")
