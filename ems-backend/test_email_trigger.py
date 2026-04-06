import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import asyncio

sys.path.insert(0, ".")

from app.config import settings
from app.services.email_service import notify_temporary_password

async def test_email():
    print("Triggering test email for admi@nmims.in...")
    notify_temporary_password("admi@nmims.in", "TestPass123", is_reset=True)
    print("Email task dispatched to Celery.")

if __name__ == "__main__":
    asyncio.run(test_email())
