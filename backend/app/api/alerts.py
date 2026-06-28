"""
FraudGuard AI — Alerts API Routes

Real-time alert feed for flagged transactions.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.database import TransactionRecord
from app.models.schemas import AlertItem, AlertListResponse, RiskLevel

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=AlertListResponse)
def get_alerts(
    severity: str | None = Query(None, description="Filter by risk level"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Paginated list of flagged transactions (alerts).
    Optionally filter by severity: CRITICAL, HIGH, MEDIUM, LOW.
    """
    query = db.query(TransactionRecord).filter(
        TransactionRecord.prediction_label == 1
    )

    if severity:
        query = query.filter(TransactionRecord.risk_level == severity.upper())

    total = query.count()
    records = (
        query.order_by(TransactionRecord.time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    alerts = [
        AlertItem(
            transaction_id=r.transaction_id,
            customer_id=r.customer_id,
            amount=r.amount,
            merchant=r.merchant,
            location=r.location or "",
            risk_score=r.risk_score or 0.0,
            risk_level=RiskLevel(r.risk_level) if r.risk_level else RiskLevel.MEDIUM,
            timestamp=r.time,
            ai_explanation=r.ai_audit_explanation,
        )
        for r in records
    ]

    return AlertListResponse(alerts=alerts, total=total)
