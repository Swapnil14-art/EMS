"""Add password and profile fields

Revision ID: 999b6833df41
Revises: 
Create Date: 2026-04-01 08:38:04.510592

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '999b6833df41'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Departments (Top-level dependency)
    op.create_table('departments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=150), nullable=False),
    sa.Column('code', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('code')
    )

    # 2. Create Users (But without club_id FK yet because clubs doesn't exist)
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=True),
    sa.Column('is_first_login', sa.Boolean(), nullable=False),
    sa.Column('name', sa.String(length=150), nullable=True),
    sa.Column('role', sa.String(length=50), nullable=False),
    sa.Column('department_id', sa.Integer(), nullable=True),
    sa.Column('club_id', sa.Integer(), nullable=True),
    sa.Column('year_of_study', sa.String(length=10), nullable=True),
    sa.Column('branch', sa.String(length=100), nullable=True),
    sa.Column('course', sa.String(length=100), nullable=True),
    sa.Column('sap_id', sa.String(length=50), nullable=True),
    sa.Column('phone_number', sa.String(length=20), nullable=True),
    sa.Column('club_coordinator_request', sa.Boolean(), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('last_login_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('sap_id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 3. Create Clubs (Depends on users and departments)
    op.create_table('clubs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=150), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=True),
    sa.Column('department_id', sa.Integer(), nullable=False),
    sa.Column('coordinator_id', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['coordinator_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # 4. Now add the FK constraint back to users for club_id
    op.create_foreign_key('fk_users_club_id', 'users', 'clubs', ['club_id'], ['id'])

    # 5. Create the rest of the tables
    op.create_table('pre_approved_users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('role', sa.String(length=50), nullable=False),
    sa.Column('department_id', sa.Integer(), nullable=True),
    sa.Column('club_id', sa.Integer(), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('consumed', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pre_approved_users_email'), 'pre_approved_users', ['email'], unique=True)

    op.create_table('venues',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=150), nullable=False),
    sa.Column('location', sa.String(length=255), nullable=True),
    sa.Column('max_capacity', sa.Integer(), nullable=False),
    sa.Column('aliases', sa.Text(), nullable=True),
    sa.Column('department_id', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('events',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('event_type', sa.String(length=100), nullable=False),
    sa.Column('school_department', sa.String(length=150), nullable=False),
    sa.Column('event_incharge_name', sa.String(length=150), nullable=False),
    sa.Column('event_incharge_contact', sa.String(length=30), nullable=False),
    sa.Column('target_audience', sa.String(length=100), nullable=False),
    sa.Column('is_club_event', sa.Boolean(), nullable=False),
    sa.Column('club_id', sa.Integer(), nullable=True),
    sa.Column('is_collaborative', sa.Boolean(), nullable=False),
    sa.Column('is_sponsored', sa.Boolean(), nullable=False),
    sa.Column('custom_approval_chain', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('start_datetime', sa.TIMESTAMP(timezone=True), nullable=False),
    sa.Column('end_datetime', sa.TIMESTAMP(timezone=True), nullable=False),
    sa.Column('registration_deadline', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('venue_id', sa.Integer(), nullable=True),
    sa.Column('venue_custom', sa.String(length=255), nullable=True),
    sa.Column('venue_type', sa.String(length=100), nullable=True),
    sa.Column('seating_arrangement', sa.String(length=100), nullable=True),
    sa.Column('seating_other_detail', sa.String(length=200), nullable=True),
    sa.Column('tables_required', sa.String(length=150), nullable=True),
    sa.Column('chairs_required', sa.String(length=150), nullable=True),
    sa.Column('podium_setup', sa.Boolean(), nullable=True),
    sa.Column('podium_details', sa.Text(), nullable=True),
    sa.Column('decoration', sa.Boolean(), nullable=True),
    sa.Column('decoration_details', sa.Text(), nullable=True),
    sa.Column('it_projector', sa.Boolean(), nullable=True),
    sa.Column('it_audio', sa.Boolean(), nullable=True),
    sa.Column('it_audio_details', sa.Text(), nullable=True),
    sa.Column('it_wifi', sa.Boolean(), nullable=True),
    sa.Column('it_laptop', sa.Boolean(), nullable=True),
    sa.Column('it_laptop_details', sa.Text(), nullable=True),
    sa.Column('it_other', sa.Text(), nullable=True),
    sa.Column('food_items', sa.Boolean(), nullable=True),
    sa.Column('food_details', sa.Text(), nullable=True),
    sa.Column('beverage_items', sa.Boolean(), nullable=True),
    sa.Column('beverage_details', sa.Text(), nullable=True),
    sa.Column('pax_count', sa.Integer(), nullable=True),
    sa.Column('food_service_time', sa.String(length=100), nullable=True),
    sa.Column('transport', sa.Boolean(), nullable=True),
    sa.Column('transport_details', sa.Text(), nullable=True),
    sa.Column('security', sa.Boolean(), nullable=True),
    sa.Column('security_details', sa.Text(), nullable=True),
    sa.Column('printing', sa.Boolean(), nullable=True),
    sa.Column('printing_details', sa.Text(), nullable=True),
    sa.Column('volunteers', sa.Boolean(), nullable=True),
    sa.Column('volunteers_details', sa.Text(), nullable=True),
    sa.Column('other_requirements', sa.Text(), nullable=True),
    sa.Column('poster_path', sa.Text(), nullable=True),
    sa.Column('budget', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('comments', sa.Text(), nullable=True),
    sa.Column('participant_doc_path', sa.Text(), nullable=True),
    sa.Column('status', sa.String(length=60), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('responsible_coordinator_id', sa.Integer(), nullable=True),
    sa.Column('current_approval_step', sa.Integer(), nullable=False),
    sa.Column('edit_count', sa.Integer(), nullable=False),
    sa.Column('last_edited_by', sa.Integer(), nullable=True),
    sa.Column('last_edited_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('cancellation_reason', sa.Text(), nullable=True),
    sa.Column('cancelled_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['cancelled_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['last_edited_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['responsible_coordinator_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['venue_id'], ['venues.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('email_notifications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('recipient', sa.String(length=255), nullable=False),
    sa.Column('type', sa.String(length=100), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=True),
    sa.Column('subject', sa.String(length=255), nullable=True),
    sa.Column('sent_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('event_approvals',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('approver_id', sa.Integer(), nullable=False),
    sa.Column('role_at_approval', sa.String(length=50), nullable=False),
    sa.Column('sequence_order', sa.Integer(), nullable=False),
    sa.Column('is_parallel', sa.Boolean(), nullable=False),
    sa.Column('parallel_group', sa.Integer(), nullable=True),
    sa.Column('action', sa.String(length=20), nullable=False),
    sa.Column('remarks', sa.Text(), nullable=True),
    sa.Column('venue_clash_override', sa.Boolean(), nullable=False),
    sa.Column('venue_clash_override_reason', sa.Text(), nullable=True),
    sa.Column('actioned_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['approver_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('event_collaborating_clubs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('club_id', sa.Integer(), nullable=False),
    sa.Column('added_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('event_coordinators',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('added_by', sa.Integer(), nullable=False),
    sa.Column('added_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['added_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('event_documents',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('file_path', sa.Text(), nullable=True),
    sa.Column('url', sa.Text(), nullable=True),
    sa.Column('uploaded_by', sa.Integer(), nullable=False),
    sa.Column('uploaded_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('event_edit_history',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('edited_by', sa.Integer(), nullable=False),
    sa.Column('edited_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('old_snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('new_snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.ForeignKeyConstraint(['edited_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('event_links',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('link_type', sa.String(length=50), nullable=False),
    sa.Column('url', sa.Text(), nullable=False),
    sa.Column('label', sa.String(length=150), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('event_other_docs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=True),
    sa.Column('file_path', sa.Text(), nullable=False),
    sa.Column('uploaded_by', sa.Integer(), nullable=False),
    sa.Column('uploaded_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('event_registrations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('registered_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('event_id', 'student_id', name='uq_event_student')
    )

    op.create_table('event_reports',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('submitted_by', sa.Integer(), nullable=False),
    sa.Column('submitted_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('event_summary', sa.Text(), nullable=False),
    sa.Column('actual_budget', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('participant_count', sa.Integer(), nullable=False),
    sa.Column('outcomes', sa.Text(), nullable=False),
    sa.Column('issues', sa.Text(), nullable=True),
    sa.Column('feedback', sa.Text(), nullable=True),
    sa.Column('attendance_doc_path', sa.Text(), nullable=True),
    sa.Column('generated_report_path', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.ForeignKeyConstraint(['submitted_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('event_id')
    )

    op.create_table('event_sponsors',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('logo_path', sa.Text(), nullable=True),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('event_sponsors')
    op.drop_table('event_reports')
    op.drop_table('event_registrations')
    op.drop_table('event_other_docs')
    op.drop_table('event_links')
    op.drop_table('event_edit_history')
    op.drop_table('event_documents')
    op.drop_table('event_coordinators')
    op.drop_table('event_collaborating_clubs')
    op.drop_table('event_approvals')
    op.drop_table('email_notifications')
    op.drop_table('events')
    op.drop_table('venues')
    op.drop_index(op.f('ix_pre_approved_users_email'), table_name='pre_approved_users')
    op.drop_table('pre_approved_users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_table('departments')
    op.drop_table('clubs')
    # ### end Alembic commands ###
