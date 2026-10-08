import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "FinSight AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "finsight-ai-super-secret-key-32-bytes-minimum-length-change-in-prod-2026"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./finsight.db"
    )

    class Config:
        case_sensitive = True


settings = Settings()
