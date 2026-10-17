"""rename system_config to system_settings and clean field names

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-05 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename columns first (while table still has old name)
    op.alter_column('system_config', 'disable_registration',
                    new_column_name='disable_student_registration')
    op.alter_column('system_config', 'force_login_mode',
                    new_column_name='force_login')
    op.alter_column('system_config', 'disable_role_based_signup',
                    new_column_name='disable_role_signup')
    # Rename the table
    op.rename_table('system_config', 'system_settings')


def downgrade() -> None:
    op.rename_table('system_settings', 'system_config')
    op.alter_column('system_config', 'disable_student_registration',
                    new_column_name='disable_registration')
    op.alter_column('system_config', 'force_login',
                    new_column_name='force_login_mode')
    op.alter_column('system_config', 'disable_role_signup',
                    new_column_name='disable_role_based_signup')
