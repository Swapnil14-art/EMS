"""make_club_department_id_nullable

Revision ID: f6789abcdef0
Revises: f56789abcde0
Create Date: 2026-08-02

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f6789abcdef0'
down_revision = 'f56789abcde0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('clubs', 'department_id',
               existing_type=sa.INTEGER(),
               nullable=True)


def downgrade() -> None:
    op.alter_column('clubs', 'department_id',
               existing_type=sa.INTEGER(),
               nullable=False)
