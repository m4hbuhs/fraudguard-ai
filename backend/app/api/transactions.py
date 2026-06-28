"""
FraudGuard AI — Transaction API Routes

Endpoints for evaluating, listing, and inspecting transactions.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.database import TransactionRecord
from app.models.schemas import (
    TransactionDetail,
    TransactionEvaluateRequest,
    TransactionEvaluateResponse,
    TransactionListResponse,
    TransactionStatus,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


def _get_transaction_service():
    """Lazy import to access the service from app state."""
    from app.main import transaction_service
    return transaction_service


@router.post("/evaluate", response_model=TransactionEvaluateResponse)
def evaluate_transaction(
    payload: TransactionEvaluateRequest,
    db: Session = Depends(get_db),
):
    """
    Evaluate a transaction for fraud risk using the hybrid AI engine.
    Returns risk assessment with XGBoost + LSTM scores and optional AI explanation.
    """
    service = _get_transaction_service()
    return service.evaluate(payload, db)


@router.get("/recent", response_model=TransactionListResponse)
def get_recent_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get paginated list of recent transactions."""
    offset = (page - 1) * page_size

    total = db.query(TransactionRecord).count()
    records = (
        db.query(TransactionRecord)
        .order_by(TransactionRecord.time.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    transactions = [
        TransactionDetail(
            transaction_id=r.transaction_id,
            customer_id=r.customer_id,
            amount=r.amount,
            merchant=r.merchant,
            location=r.location or "",
            device=r.device or "",
            card_type=r.card_type or "",
            time=r.time,
            status=(
                TransactionStatus.DECLINED
                if r.prediction_label == 1
                else TransactionStatus.APPROVED
            ),
            risk_score=r.risk_score,
            risk_level=r.risk_level,
            xgb_score=r.xgb_score,
            lstm_score=r.lstm_score,
            ai_audit_explanation=r.ai_audit_explanation,
        )
        for r in records
    ]

    return TransactionListResponse(
        transactions=transactions,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{transaction_id}", response_model=TransactionDetail)
def get_transaction_detail(
    transaction_id: str,
    db: Session = Depends(get_db),
):
    """Get detailed view of a specific transaction."""
    record = (
        db.query(TransactionRecord)
        .filter(TransactionRecord.transaction_id == transaction_id)
        .first()
    )
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Transaction not found.")

    return TransactionDetail(
        transaction_id=record.transaction_id,
        customer_id=record.customer_id,
        amount=record.amount,
        merchant=record.merchant,
        location=record.location or "",
        device=record.device or "",
        card_type=record.card_type or "",
        time=record.time,
        status=(
            TransactionStatus.DECLINED
            if record.prediction_label == 1
            else TransactionStatus.APPROVED
        ),
        risk_score=record.risk_score,
        risk_level=record.risk_level,
        xgb_score=record.xgb_score,
        lstm_score=record.lstm_score,
        ai_audit_explanation=record.ai_audit_explanation,
    )
