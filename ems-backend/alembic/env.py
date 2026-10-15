import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from app.database import Base
from app.config import settings

# Import ALL models so Alembic detects them
from app.models import user, club, department, venue, event  # noqa: F401
from app.models import event_approval, event_registration    # noqa: F401
from app.models import event_report, email_notification      # noqa: F401

import os

config = context.config
db_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL
config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    db_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL
    try:
        import socket
        socket.gethostbyname("ems_db")
    except Exception:
        db_url = db_url.replace("@ems_db:", "@127.0.0.1:")

    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = db_url

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
