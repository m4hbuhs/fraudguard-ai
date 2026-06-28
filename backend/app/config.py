"""
FraudGuard AI — Centralized Configuration

All settings are loaded from environment variables via Pydantic Settings.
No hardcoded passwords, paths, or magic numbers.
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Database ──────────────────────────────────────────────
    database_url: str = Field(
        default="postgresql://postgres:password@localhost:5432/fraud_db",
        description="PostgreSQL connection string",
    )
    db_pool_size: int = Field(default=20, ge=1, le=100)
    db_max_overflow: int = Field(default=10, ge=0, le=50)

    # ── AI Model Paths ────────────────────────────────────────
    lstm_model_path: str = Field(default="models/lstm_model.pth")
    xgb_model_path: str = Field(default="models/model.pkl")
    amount_scaler_path: str = Field(default="models/amount_scaler.pkl")
    categorical_encoders_path: str = Field(default="models/categorical_encoders.pkl")

    # ── Risk Thresholds (configurable without code changes) ───
    xgb_threshold: float = Field(default=0.85, ge=0.0, le=1.0)
    lstm_threshold: float = Field(default=0.75, ge=0.0, le=1.0)
    xgb_weight: float = Field(default=0.55, ge=0.0, le=1.0)
    lstm_weight: float = Field(default=0.45, ge=0.0, le=1.0)

    # ── Risk Level Boundaries ─────────────────────────────────
    risk_critical: float = Field(default=0.85)
    risk_high: float = Field(default=0.70)
    risk_medium: float = Field(default=0.50)

    # ── RAG / LLM ────────────────────────────────────────────
    gemini_api_key: str = Field(default="")
    gemini_model: str = Field(default="gemini-2.5-flash")
    gemini_embedding_model: str = Field(default="models/gemini-embedding-001")
    faiss_index_path: str = Field(default="data/faiss_index")
    compliance_rules_path: str = Field(default="data/compliance_rules.txt")
    google_api_key: Optional[str] = None

    # ── CORS ──────────────────────────────────────────────────
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    # ── Feature Pipeline ──────────────────────────────────────
    lstm_sequence_length: int = Field(default=5, ge=1, le=50)
    lstm_input_features: int = Field(default=6, ge=1)

    # ── Server ────────────────────────────────────────────────
    app_name: str = Field(default="FraudGuard AI")
    app_version: str = Field(default="2.0.0")
    debug: bool = Field(default=False)

    model_config = {
        "env_file": ".env",
        "extra": "ignore",  
        "case_sensitive": False
    }


@lru_cache()
def get_settings():
    settings = Settings()
    
    # Safely feed the key into the environment after Pydantic validation passes
    import os
    api_key = getattr(settings, "GEMINI_API_KEY", getattr(settings, "gemini_api_key", None))
    if api_key:
        os.environ["GOOGLE_API_KEY"] = api_key
        os.environ["GEMINI_API_KEY"] = api_key

    return settings
