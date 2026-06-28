"""
FraudGuard AI — Pydantic Request/Response Schemas

Type-safe API contracts with proper validation.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────

class RiskLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TransactionStatus(str, Enum):
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"
    UNDER_REVIEW = "UNDER_REVIEW"
    BLOCKED = "BLOCKED"


# ── Transaction Schemas ───────────────────────────────────────

class TransactionEvaluateRequest(BaseModel):
    """Input payload for transaction evaluation."""

    transaction_id: str = Field(..., min_length=1, max_length=50)
    customer_id: str = Field(..., min_length=1, max_length=50)
    amount: float = Field(..., gt=0, le=10_000_000)
    merchant: str = Field(..., min_length=1, max_length=100)
    location: str = Field(..., min_length=1, max_length=100)
    device: str = Field(..., min_length=1, max_length=50)
    card_type: str = Field(..., min_length=1, max_length=30)


class RiskAssessment(BaseModel):
    """Structured risk scoring result from the ensemble engine."""

    risk_score: float = Field(..., ge=0.0, le=1.0, description="Weighted ensemble score")
    risk_level: RiskLevel
    xgb_score: float = Field(..., ge=0.0, le=1.0)
    lstm_score: float = Field(..., ge=0.0, le=1.0)
    xgb_flagged: bool
    lstm_flagged: bool
    triggers: list[str] = Field(default_factory=list, description="Feature triggers that fired")


class TransactionEvaluateResponse(BaseModel):
    """Response from transaction evaluation endpoint."""

    transaction_id: str
    status: TransactionStatus
    risk_assessment: RiskAssessment
    ai_audit_explanation: str | None = None


class TransactionDetail(BaseModel):
    """Full transaction record for detail view."""

    transaction_id: str
    customer_id: str
    amount: float
    merchant: str
    location: str
    device: str
    card_type: str
    time: datetime
    status: TransactionStatus
    risk_score: float | None = None
    risk_level: str | None = None
    xgb_score: float | None = None
    lstm_score: float | None = None
    ai_audit_explanation: str | None = None


class TransactionListResponse(BaseModel):
    """Paginated list of transactions."""

    transactions: list[TransactionDetail]
    total: int
    page: int
    page_size: int


# ── Dashboard Metrics ─────────────────────────────────────────

class DashboardMetrics(BaseModel):
    """High-level KPI response for the dashboard."""

    total_transactions: int
    total_flagged: int
    fraud_rate: float
    false_positive_rate: float
    revenue_saved: float
    transactions_today: int
    flagged_today: int


class FraudTrendPoint(BaseModel):
    """Single data point in fraud trend time-series."""

    date: str
    total: int
    flagged: int
    rate: float


class FraudTrendResponse(BaseModel):
    """Fraud trend data over a time period."""

    data: list[FraudTrendPoint]


# ── Model Performance ─────────────────────────────────────────

class ModelPerformanceResponse(BaseModel):
    """Model performance metrics for the insights page."""

    roc_auc: float
    precision: float
    recall: float
    f1_score: float
    accuracy: float
    training_date: str
    dataset_size: int
    roc_curve: list[dict]
    precision_recall_curve: list[dict]
    feature_importance: list[dict]
    confusion_matrix: dict


# ── Alerts ────────────────────────────────────────────────────

class AlertItem(BaseModel):
    """Single alert entry for the alert feed."""

    transaction_id: str
    customer_id: str
    amount: float
    merchant: str
    location: str
    risk_score: float
    risk_level: RiskLevel
    timestamp: datetime
    ai_explanation: str | None = None


class AlertListResponse(BaseModel):
    """Paginated alert list."""

    alerts: list[AlertItem]
    total: int


# ── Chat ──────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    """Single chat message."""

    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    """Request payload for forensic chat."""

    message: str = Field(..., min_length=1, max_length=2000)
    chat_history: list[ChatMessage] = Field(default_factory=list)
    transaction_context: dict | None = None


class ChatResponse(BaseModel):
    """Response from the forensic chat endpoint."""

    reply: str
    sources: list[str] = Field(default_factory=list)
