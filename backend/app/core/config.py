# app/core/config.py
from functools import lru_cache
from typing import List, Optional, Literal, Union

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    project_name: str = "Furniture Store API"
    environment: Literal["local", "dev", "test", "prod"] = "local"
    debug: bool = True
    api_prefix: str = "/api"

    # Nếu DSN có driver (postgresql+psycopg), dùng str an toàn hơn PostgresDsn
    database_url: str = Field(..., alias="DATABASE_URL")
    test_database_url: Optional[str] = Field(default=None, alias="TEST_DATABASE_URL")

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

    # Use Union to accept both string and list
    cors_allow_origins: Union[str, List[str]] = Field(default="")

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        env_prefix="",     # dùng alias trên từng field
        extra="ignore",    # tránh vấp khi có biến env dư
    )

    # Validator for CORS origins - parse comma-separated string
    @field_validator("cors_allow_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            if not v or v.strip() == "":
                return []
            # Handle JSON array format
            if v.strip().startswith("["):
                import json
                try:
                    return json.loads(v)
                except:
                    pass
            # Split by comma for simple format
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, (list, tuple)):
            return list(v)
        return []

    @property
    def effective_database_url(self) -> str:
        if self.environment == "test" and self.test_database_url:
            return self.test_database_url
        return self.database_url

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
