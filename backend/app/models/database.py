"""
FraudGuard AI — SQLAlchemy ORM Models

Defines the database schema for user profiles and transaction records.
Optimized with database-level server defaults and timezone awareness.
"""

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func
from app.core.database import Base


class UserProfile(Base):
    """Customer profile registry."""

    __tablename__ = "user_profiles"

    customer_id = Column(String, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    account_status = Column(String, default="Active")  # Active | Suspended | Frozen
    credit_limit = Column(Float, default=100_000.0)
    home_location = Column(String)
    
    # Database-level server side defaults
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )


class TransactionRecord(Base):
    """Individual transaction record with risk assessment results."""

    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    customer_id = Column(
        String, ForeignKey("user_profiles.customer_id"), index=True, nullable=False
    )
    amount = Column(Float, nullable=False)
    merchant = Column(String, nullable=False)
    time = Column(DateTime(timezone=True), nullable=False)
    location = Column(String)
    device = Column(String)
    previous_fraud = Column(Integer, default=0)
    card_type = Column(String)

    # ── Risk Assessment Results ───────────────────────────────
    prediction_label = Column(Integer, nullable=True)  # 0=legit, 1=fraud
    risk_score = Column(Float, nullable=True)  # Weighted ensemble probability
    risk_level = Column(String, nullable=True)  # CRITICAL | HIGH | MEDIUM | LOW
    xgb_score = Column(Float, nullable=True)
    lstm_score = Column(Float, nullable=True)
    ai_audit_explanation = Column(Text, nullable=True)

    # ── Timestamps ────────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )