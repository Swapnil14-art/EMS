from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.staticfiles import StaticFiles
import os
import logging
import time
import uuid

from app.config import settings
from app.rate_limit import limiter
from app.auth.router import router as auth_router
from app.routers import (
    users, departments, clubs, venues,
    events, approvals, registrations,
    reports, rnd_reports, dashboard, admin,
    system, notifications, permissions, legal,
)
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.database import AsyncSessionLocal
from app.tasks.status_transitions import check_and_transition_events_async

logger = logging.getLogger("ems.request")

scheduler = AsyncIOScheduler()


async def scheduled_status_check():
    async with AsyncSessionLocal() as session:
        try:
            res = await check_and_transition_events_async(session)
            if res.get("started", 0) > 0 or res.get("completed", 0) > 0:
                logger.info(
                    "APScheduler event status transitions: started=%d completed=%d",
                    res["started"],
                    res["completed"],
                )
        except Exception:
            logger.exception("Error during scheduled event status transition check")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: register and start scheduler
    scheduler.add_job(
        scheduled_status_check,
        "interval",
        seconds=120,
        id="event_status_transitions",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started (event status transitions every 120s)")
    try:
        yield
    finally:
        # Graceful shutdown
        try:
            scheduler.shutdown(wait=False)
            logger.info("APScheduler shutdown successfully")
        except Exception as e:
            logger.warning("Error shutting down APScheduler: %s", e)


def create_app() -> FastAPI:
    app = FastAPI(
        title="EMS — NMIMS Shirpur",
        version="6.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start = time.perf_counter()
        try:
            response: Response = await call_next(request)
        except Exception:
            logger.exception("Unhandled request failure request_id=%s method=%s path=%s", request_id, request.method, request.url.path)
            raise
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.3f}"
        path = request.url.path
        if not (path == "/health" or path.startswith("/uploads/") or path.startswith("/static/")):
            logger.info("request_id=%s method=%s path=%s status=%s duration_ms=%.1f", request_id, request.method, path, response.status_code, (time.perf_counter() - start) * 1000)
        return response

    # CORS must remain an explicit allow-list, including in development.
    # Credentials cannot safely be combined with a wildcard origin policy.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Static file serving
    os.makedirs(settings.STORAGE_ROOT, exist_ok=True)
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    os.makedirs(static_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.STORAGE_ROOT), name="uploads")
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

    # Routers
    app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
    app.include_router(users.router, prefix="/users", tags=["Users"])
    app.include_router(departments.router, prefix="/departments", tags=["Departments"])
    app.include_router(clubs.router, prefix="/clubs", tags=["Clubs"])
    app.include_router(venues.router, prefix="/venues", tags=["Venues"])
    app.include_router(events.router, prefix="/events", tags=["Events"])
    app.include_router(approvals.router, prefix="/approvals", tags=["Approvals"])
    app.include_router(registrations.router, prefix="/registrations", tags=["Registrations"])
    app.include_router(reports.router, prefix="/reports", tags=["Reports"])
    app.include_router(rnd_reports.router, prefix="/rnd-reports", tags=["RnD Reports"])
    app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
    app.include_router(admin.router, prefix="/admin", tags=["Admin"])
    app.include_router(system.router, prefix="/system", tags=["System Settings"])
    app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
    app.include_router(permissions.router, prefix="/permissions", tags=["Permissions"])
    app.include_router(legal.router, prefix="/legal", tags=["Legal & Privacy"])

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "ok", "version": "6.0.0"}

    return app


app = create_app()
