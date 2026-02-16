from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Atlas Tourism CRM"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://atlas:atlas@localhost:5432/atlas_crm"
    DATABASE_URL_SYNC: str = "postgresql://atlas:atlas@localhost:5432/atlas_crm"
    REDIS_URL: str = "redis://localhost:6379/0"

    @model_validator(mode="after")
    def fix_database_urls(self) -> "Settings":
        # Render gives postgres:// but asyncpg needs postgresql+asyncpg://
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
        elif self.DATABASE_URL.startswith("postgresql://") and "asyncpg" not in self.DATABASE_URL:
            self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Sync URL
        if not self.DATABASE_URL_SYNC or self.DATABASE_URL_SYNC == "postgresql://atlas:atlas@localhost:5432/atlas_crm":
            self.DATABASE_URL_SYNC = self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
        return self

    JWT_SECRET: str = "change-me-in-production-super-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "atlas-verify-token"
    WHATSAPP_API_URL: str = "https://graph.facebook.com/v18.0"

    SIPUNI_API_KEY: str = ""
    SIPUNI_WEBHOOK_SECRET: str = ""

    MOCK_INTEGRATIONS: bool = True

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost", "*"]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
