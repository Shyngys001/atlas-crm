from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Atlas Tourism CRM"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://atlas:atlas@localhost:5432/atlas_crm"
    DATABASE_URL_SYNC: str = "postgresql://atlas:atlas@localhost:5432/atlas_crm"
    REDIS_URL: str = "redis://localhost:6379/0"

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
