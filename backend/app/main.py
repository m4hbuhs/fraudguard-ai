"""
FraudGuard AI — Application Entry Point

FastAPI app factory with lifespan context manager.
Initializes all AI engines, services, and middleware on startup.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.core.database import init_db
from app.core.logging import setup_logging, get_logger
from app.engine.lstm import LSTMInferenceEngine
from app.engine.xgboost_engine import XGBoostInferenceEngine
from app.engine.ensemble import EnsembleScorer
from app.engine.feature_pipeline import FeaturePipeline
from app.services.transaction_service import TransactionService

# ── Module-level singletons (populated during lifespan) ───────
transaction_service: TransactionService | None = None
investigator = None

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Replaces the deprecated @app.on_event("startup") pattern.
    """
    global transaction_service, investigator

    setup_logging()
    settings = get_settings()
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")

    # 1. Initialize database tables
    init_db()
    logger.info("Database tables initialized")

    # 2. Load AI engines
    lstm_engine = LSTMInferenceEngine()
    lstm_engine.load()

    xgb_engine = XGBoostInferenceEngine()
    xgb_engine.load()

    # 3. Initialize support services
    feature_pipeline = FeaturePipeline()
    ensemble_scorer = EnsembleScorer()

    # 4. Initialize RAG investigator (non-critical — app works without it)
    try:
        from app.services.investigator import RAGInvestigator
        investigator = RAGInvestigator()
        logger.info("RAG Investigator initialized")
    except Exception as e:
        logger.warning(f"RAG Investigator unavailable: {e}")
        investigator = None

    # 5. Wire up the transaction service
    transaction_service = TransactionService(
        lstm_engine=lstm_engine,
        xgb_engine=xgb_engine,
        feature_pipeline=feature_pipeline,
        ensemble_scorer=ensemble_scorer,
        investigator=investigator,
    )

    logger.info("All engines loaded — FraudGuard AI is operational")
    yield

    # Shutdown
    logger.info("Shutting down FraudGuard AI")


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Enterprise AI-Powered Fraud Detection Engine",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routes
    from app.api.router import api_router
    app.include_router(api_router)

    # Health check
    @app.get("/health")
    def health_check():
        return {
            "status": "healthy",
            "service": settings.app_name,
            "version": settings.app_version,
        }

    return app


app = create_app()
