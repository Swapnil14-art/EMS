from pydantic import model_validator
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

    SMTP_HOST: str = "smtp-relay.brevo.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "a73304001@smtp-brevo.com"
    SMTP_PASSWORD: str = "changeme"
    SMTP_FROM: str = "swapnilsinghdps8288@gmail.com"
    SMTP_FROM_NAME: str = "EMS"
    SMTP_TLS: bool = True

    STORAGE_ROOT: str = "storage"
    FRONTEND_URL: str = "http://localhost:3000"
    COLLEGE_NAME: str = "SVKM's NMIMS, Shirpur Campus"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    @property
    def allowed_domain_list(self) -> List[str]:
        return [d.strip() for d in self.ALLOWED_DOMAINS.split(",")]

    @model_validator(mode="after")
    def validate_production_secrets(self):
        if self.APP_ENV.lower() == "production":
            unsafe_values = {"changeme", "changeme-jwt-secret-min-32-chars!!", "changeme-refresh-secret-min-32-chars!"}
            if self.APP_SECRET_KEY in unsafe_values or self.JWT_SECRET in unsafe_values or self.JWT_REFRESH_SECRET in unsafe_values:
                raise ValueError("Production requires unique APP_SECRET_KEY, JWT_SECRET, and JWT_REFRESH_SECRET values")
            if not self.FRONTEND_URL.startswith("https://"):
                raise ValueError("Production FRONTEND_URL must use HTTPS")
        return self

    class Config:
        env_file = ".env"


settings = Settings()
