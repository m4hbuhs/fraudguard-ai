"""
FraudGuard AI — Transaction Service

Business logic for evaluating transactions, orchestrating the AI engines,
and persisting results. This is the core service that the API layer calls.
"""

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.logging import get_logger
from app.engine.ensemble import EnsembleScorer, RiskResult
from app.engine.feature_pipeline import FeaturePipeline
from app.engine.lstm import LSTMInferenceEngine
from app.engine.xgboost_engine import XGBoostInferenceEngine
from app.models.database import TransactionRecord, UserProfile
from app.models.schemas import (
    RiskAssessment,
    TransactionEvaluateRequest,
    TransactionEvaluateResponse,
    TransactionStatus,
)

logger = get_logger("services.transaction")


class TransactionService:
    """
    Orchestrates the complete transaction evaluation pipeline:
    1. Validate customer profile
    2. Persist raw transaction
    3. Run LSTM + XGBoost inference
    4. Compute ensemble risk score
    5. Optionally trigger RAG explanation
    6. Return structured response
    """

    def __init__(
        self,
        lstm_engine: LSTMInferenceEngine,
        xgb_engine: XGBoostInferenceEngine,
        feature_pipeline: FeaturePipeline,
        ensemble_scorer: EnsembleScorer,
        investigator=None,
    ):
        self.lstm_engine = lstm_engine
        self.xgb_engine = xgb_engine
        self.feature_pipeline = feature_pipeline
        self.ensemble_scorer = ensemble_scorer
        self.investigator = investigator
        self.settings = get_settings()

    def evaluate(
        self, payload: TransactionEvaluateRequest, db: Session
    ) -> TransactionEvaluateResponse:
        """
        Full evaluation pipeline for a single transaction.
        """
        # 1. Validate customer exists — auto-register if missing
        profile = (
            db.query(UserProfile)
            .filter(UserProfile.customer_id == payload.customer_id)
            .first()
        )
        if not profile:
            logger.info(
                f"Customer {payload.customer_id} not found — auto-registering."
            )
            profile = UserProfile(
                customer_id=payload.customer_id,
                full_name=f"Customer {payload.customer_id[-5:]}",
                account_status="Active",
                credit_limit=100_000.0,
                home_location=payload.location,
            )
            db.add(profile)
            db.flush()

        if profile.account_status == "Suspended":
            return TransactionEvaluateResponse(
                transaction_id=payload.transaction_id,
                status=TransactionStatus.BLOCKED,
                risk_assessment=RiskAssessment(
                    risk_score=1.0,
                    risk_level="CRITICAL",
                    xgb_score=0.0,
                    lstm_score=0.0,
                    xgb_flagged=False,
                    lstm_flagged=False,
                    triggers=["Account is suspended"],
                ),
                ai_audit_explanation="Transaction blocked: customer account is suspended.",
            )

        # 2. Persist raw transaction
        # Ensure time is never null before inserting to the database
        transaction_time = getattr(payload, 'time', None) or datetime.now(timezone.utc)

        new_txn = TransactionRecord(
            transaction_id=payload.transaction_id,
            customer_id=payload.customer_id,
            amount=payload.amount,
            merchant=payload.merchant,
            time=transaction_time,
            location=payload.location,
            device=payload.device,
            card_type=payload.card_type,
        )
        db.add(new_txn)
        db.flush()  # Flush to get the record available for queries without committing

        # 3. Run LSTM inference (sequence risk)
        lstm_tensor = self.feature_pipeline.get_sequence_tensor(db, payload.customer_id)
        lstm_score = self.lstm_engine.predict(lstm_tensor)

        # 4. Run XGBoost inference (tabular risk)
        xgb_score = self.xgb_engine.predict(
            amount=payload.amount,
            merchant=payload.merchant,
            location=payload.location,
            device=payload.device,
            card_type=payload.card_type,
            txn_time=new_txn.time,
            previous_fraud=new_txn.previous_fraud or 0,
        )

        # 5. Ensemble scoring
        risk_result: RiskResult = self.ensemble_scorer.score(
            xgb_score=xgb_score,
            lstm_score=lstm_score,
            amount=payload.amount,
            location=payload.location,
        )

        # 6. Generate AI explanation for flagged transactions
        ai_explanation = None
        if risk_result.is_fraud and self.investigator:
            try:
                ai_explanation = self.investigator.generate_audit_explanation(
                    customer_id=payload.customer_id,
                    merchant=payload.merchant,
                    amount=payload.amount,
                    location=payload.location,
                )
            except Exception as e:
                logger.error(f"RAG explanation generation failed: {e}")
                ai_explanation = "Automated explanation unavailable."

        # 7. Update transaction record with risk data
        new_txn.prediction_label = int(risk_result.is_fraud)
        new_txn.risk_score = risk_result.risk_score
        new_txn.risk_level = risk_result.risk_level.value
        new_txn.xgb_score = risk_result.xgb_score
        new_txn.lstm_score = risk_result.lstm_score
        new_txn.ai_audit_explanation = ai_explanation
        db.commit()

        # 8. Build response
        status = TransactionStatus.DECLINED if risk_result.is_fraud else TransactionStatus.APPROVED
        return TransactionEvaluateResponse(
            transaction_id=payload.transaction_id,
            status=status,
            risk_assessment=RiskAssessment(
                risk_score=risk_result.risk_score,
                risk_level=risk_result.risk_level,
                xgb_score=risk_result.xgb_score,
                lstm_score=risk_result.lstm_score,
                xgb_flagged=risk_result.xgb_flagged,
                lstm_flagged=risk_result.lstm_flagged,
                triggers=risk_result.triggers,
            ),
            ai_audit_explanation=ai_explanation,
        )
