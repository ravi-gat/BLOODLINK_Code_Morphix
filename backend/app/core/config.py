"""
BloodLink Application Configuration
Reads all settings from environment variables.
Never hardcode secrets in this file.
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Optional
import os


class Settings(BaseSettings):
    # ── Application ───────────────────────────────────────────────
    APP_NAME: str = "BloodLink API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = (
        "BloodLink — Blood Donation & Emergency Donor Management Platform"
    )
    DEBUG: bool = False

    # ── Database ──────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bloodlink"

    # ── JWT ───────────────────────────────────────────────────────
    JWT_SECRET: str = "change-this-in-production-use-a-long-random-string"
    JWT_REFRESH_SECRET: str = "change-this-refresh-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ──────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── Security ──────────────────────────────────────────────────
    BCRYPT_ROUNDS: int = 12

    # ── Rate Limiting ─────────────────────────────────────────────
    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_DEFAULT: str = "60/minute"

    # ── Environment ───────────────────────────────────────────────
    ENVIRONMENT: str = "development"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
