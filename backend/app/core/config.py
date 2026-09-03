from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Smart Inventory API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./inventory.db"
    secret_key: str = Field(default="development-secret-key-change-before-production", min_length=32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    backend_cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://stock-pilot-new-ver.vercel.app",
    ]
    first_admin_email: str = "admin@example.com"
    first_admin_password: str = "ChangeMe123!"
    upload_dir: str = "uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

