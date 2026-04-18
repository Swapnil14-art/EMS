from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "changeme"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://ems_user:ems_pass@db:5433/ems_db"
    DATABASE_URL_SYNC: str = "postgresql://ems_user:ems_pass@db:5433/ems_db"

    JWT_SECRET: str = "changeme-jwt-secret-min-32-chars!!"
    JWT_REFRESH_SECRET: str = "changeme-refresh-secret-min-32-chars!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    AZURE_TENANT_ID: str = "your-tenant-id"
    AZURE_CLIENT_ID: str = "your-client-id"
    AZURE_CLIENT_SECRET: str = "your-client-secret"
    AZURE_REDIRECT_URI: str = "http://localhost:8000/auth/callback"
    AZURE_AUTHORITY: str = "https://login.microsoftonline.com/your-tenant-id"

    ALLOWED_DOMAINS: str = "nmims.in,nmims.edu"

    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"

    SMTP_HOST: str = "smtp.nmims.in"
    SMTP_PORT: int = 587
    SMTP_USER: str = "noreply@nmims.in"
    SMTP_PASSWORD: str = "changeme"
    SMTP_FROM: str = "noreply@nmims.in"
    SMTP_FROM_NAME: str = "NMIMS EMS"
    SMTP_TLS: bool = True

    STORAGE_ROOT: str = "storage"
    FRONTEND_URL: str = "http://localhost:3000"
    COLLEGE_NAME: str = "SVKM's NMIMS, Shirpur Campus"

    @property
    def allowed_domain_list(self) -> List[str]:
        return [d.strip() for d in self.ALLOWED_DOMAINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
