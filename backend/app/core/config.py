from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Furniture Store API"
    environment: str = "local"
    debug: bool = True
    api_prefix: str = "/api"

    database_url: PostgresDsn

    jwt_secret_key: str
    jwt_refresh_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 60 * 24

    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: Optional[AnyHttpUrl] = None

    payment_callback_base_url: Optional[AnyHttpUrl] = None

    reward_point_rate: float = 0.05
    points_per_voucher: int = 100
    voucher_value: int = 50000

    cors_allow_origins: List[AnyHttpUrl] = []

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @field_validator("cors_allow_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [origin.strip() for origin in v.split(",")]
        if isinstance(v, (list, tuple)):
            return list(v)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]


settings = get_settings()
