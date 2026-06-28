"""
FraudGuard AI — API Router

Top-level router that mounts all API sub-routers under /api/v1.
"""

from fastapi import APIRouter

from app.api.transactions import router as transactions_router
from app.api.metrics import router as metrics_router
from app.api.alerts import router as alerts_router
from app.api.chat import router as chat_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(transactions_router)
api_router.include_router(metrics_router)
api_router.include_router(alerts_router)
api_router.include_router(chat_router)
