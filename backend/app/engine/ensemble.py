"""
FraudGuard AI — Ensemble Risk Scorer

Orchestrates both LSTM and XGBoost engines, applies weighted scoring,
and classifies transactions into risk levels.
"""

from dataclasses import dataclass, field

from app.config import get_settings
from app.core.logging import get_logger
from app.models.schemas import RiskLevel

logger = get_logger("engine.ensemble")


@dataclass
class RiskResult:
    """Structured result from the ensemble scoring pipeline."""

    risk_score: float  # Weighted ensemble probability
    risk_level: RiskLevel
    xgb_score: float
    lstm_score: float
    xgb_flagged: bool
    lstm_flagged: bool
    is_fraud: bool
    triggers: list[str] = field(default_factory=list)


class EnsembleScorer:
    """
    Combines LSTM (sequence) and XGBoost (tabular) risk scores
    using configurable weights and thresholds.

    Scoring formula:
        final_risk = (xgb_weight × xgb_prob) + (lstm_weight × lstm_prob)

    Risk levels (configurable via settings):
        CRITICAL: >= 0.85
        HIGH:     >= 0.70
        MEDIUM:   >= 0.50
        LOW:      < 0.50
    """

    def __init__(self):
        self.settings = get_settings()

    def _classify_risk_level(self, score: float) -> RiskLevel:
        """Map a probability score to a categorical risk level."""
        if score >= self.settings.risk_critical:
            return RiskLevel.CRITICAL
        elif score >= self.settings.risk_high:
            return RiskLevel.HIGH
        elif score >= self.settings.risk_medium:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    def _detect_triggers(
        self,
        xgb_score: float,
        lstm_score: float,
        amount: float = 0,
        location: str = "",
    ) -> list[str]:
        """Identify which risk factors triggered the alert."""
        triggers = []

        if xgb_score >= self.settings.xgb_threshold:
            triggers.append("Tabular risk model threshold exceeded")
        if lstm_score >= self.settings.lstm_threshold:
            triggers.append("Sequence pattern anomaly detected")
        if amount > 5000:
            triggers.append(f"High-value transaction: ${amount:,.2f}")
        if xgb_score >= 0.70 and lstm_score >= 0.60:
            triggers.append("Dual-engine corroboration")

        return triggers

    def score(
        self,
        xgb_score: float,
        lstm_score: float,
        amount: float = 0,
        location: str = "",
    ) -> RiskResult:
        """
        Compute the final ensemble risk assessment.

        Args:
            xgb_score: XGBoost fraud probability (0-1)
            lstm_score: LSTM fraud probability (0-1)
            amount: Transaction amount (for trigger detection)
            location: Transaction location (for trigger detection)

        Returns:
            RiskResult with all scoring details
        """
        # Weighted ensemble score
        risk_score = (
            self.settings.xgb_weight * xgb_score
            + self.settings.lstm_weight * lstm_score
        )
        risk_score = min(max(risk_score, 0.0), 1.0)  # Clamp to [0, 1]

        # Individual engine flags
        xgb_flagged = xgb_score >= self.settings.xgb_threshold
        lstm_flagged = lstm_score >= self.settings.lstm_threshold
        is_fraud = xgb_flagged or lstm_flagged

        # Risk classification
        risk_level = self._classify_risk_level(risk_score)

        # Feature triggers
        triggers = self._detect_triggers(xgb_score, lstm_score, amount, location)

        result = RiskResult(
            risk_score=round(risk_score, 4),
            risk_level=risk_level,
            xgb_score=round(xgb_score, 4),
            lstm_score=round(lstm_score, 4),
            xgb_flagged=xgb_flagged,
            lstm_flagged=lstm_flagged,
            is_fraud=is_fraud,
            triggers=triggers,
        )

        logger.info(
            f"Ensemble score: {result.risk_score} [{result.risk_level.value}] "
            f"(XGB: {result.xgb_score}, LSTM: {result.lstm_score})"
        )
        return result
