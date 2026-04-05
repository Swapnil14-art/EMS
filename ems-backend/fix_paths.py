import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.event import Event, EventDocument, EventOtherDoc

async def fix_paths():
    async with AsyncSessionLocal() as db:
        print("Fetching events...")
        result = await db.execute(select(Event))
        events = result.scalars().all()
        for event in events:
            if event.poster_path:
                path = event.poster_path.replace("\\", "/")
                if "events/" in path and not path.startswith("/uploads/"):
                    new_path = "/uploads/events/" + path.split("events/", 1)[1]
                    event.poster_path = new_path
                    
        doc_res = await db.execute(select(EventDocument))
        for doc in doc_res.scalars().all():
            if doc.file_path:
                path = doc.file_path.replace("\\", "/")
                if "events/" in path and not path.startswith("/uploads/"):
                    doc.file_path = "/uploads/events/" + path.split("events/", 1)[1]
                    
        other_res = await db.execute(select(EventOtherDoc))
        for doc in other_res.scalars().all():
            if doc.file_path:
                path = doc.file_path.replace("\\", "/")
                if "events/" in path and not path.startswith("/uploads/"):
                    doc.file_path = "/uploads/events/" + path.split("events/", 1)[1]

        await db.commit()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(fix_paths())
