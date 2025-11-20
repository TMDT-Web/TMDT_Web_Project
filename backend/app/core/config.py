# app/core/config.py
from functools import lru_cache
from typing import Optional, Literal, Union
import json

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Furniture Store API"
    environment: Literal["local", "dev", "test", "prod"] = "local"
    debug: bool = True
    api_prefix: str = "/api"

    database_url: str = Field(..., alias="DATABASE_URL")
    test_database_url: Optional[str] = Field(default=None, alias="TEST_DATABASE_URL")

    jwt_secret_key: str
    jwt_refresh_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 60 * 24

    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: Optional[str] = None

    payment_callback_base_url: Optional[str] = None

    reward_point_rate: float = 0.05
    points_per_voucher: int = 100
    voucher_value: int = 50000

    # Dùng Union để Pydantic không tự parse JSON
    cors_allow_origins: Union[str, list[str]] = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        env_prefix="",
        extra="ignore",
    )

    @property
    def effective_database_url(self) -> str:
        if self.environment == "test" and self.test_database_url:
            return self.test_database_url
        return self.database_url

    @field_validator("cors_allow_origins", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v):
        """Convert cors_allow_origins from string/list to list"""
        if not v:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            s = v.strip()
            # Try JSON array format
            if s.startswith("["):
                try:
                    parsed = json.loads(s)
                    if isinstance(parsed, list):
                        return [str(x) for x in parsed]
                except Exception:
                    pass
            # Comma-separated values
            return [item.strip() for item in s.split(",") if item.strip()]
        return []


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
