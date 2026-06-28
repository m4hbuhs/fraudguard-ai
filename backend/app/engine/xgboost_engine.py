"""
FraudGuard AI — XGBoost Inference Engine

Handles XGBoost model loading and tabular feature inference.
Feature DataFrame construction is isolated from the API layer.
"""

from datetime import datetime

import joblib
import numpy as np
import pandas as pd

from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger("engine.xgboost")

# Exact column order expected by the trained ColumnTransformer pipeline
XGB_FEATURE_ORDER = [
    "Amount",
    "Merchant",
    "Time",
    "Location",
    "Device",
    "Previous_Fraud",
    "Card_Type",
    "Date",
    "Month",
    "Day_of_Week",
    "Hour",
]


class XGBoostInferenceEngine:
    """
    Manages XGBoost model lifecycle: loading the serialized pipeline,
    constructing feature DataFrames, and running prediction.
    """

    def __init__(self):
        self.settings = get_settings()
        self.model = None
        self._loaded = False

    def load(self) -> None:
        """Load the serialized XGBoost pipeline from disk."""
        try:
            self.model = joblib.load(self.settings.xgb_model_path)
            self._loaded = True
            logger.info("XGBoost pipeline loaded successfully")
        except Exception as e:
            logger.warning(f"XGBoost model loading skipped: {e}")

    def _build_features(
        self,
        amount: float,
        merchant: str,
        location: str,
        device: str,
        card_type: str,
        txn_time: datetime,
        previous_fraud: int = 0,
    ) -> pd.DataFrame:
        """
        Construct the feature DataFrame matching the training schema.
        Column order is enforced to match the ColumnTransformer.
        """
        row = {
            "Amount": amount,
            "Merchant": merchant,
            "Time": txn_time,
            "Location": location,
            "Device": device,
            "Previous_Fraud": previous_fraud,
            "Card_Type": card_type,
            "Date": txn_time.day,
            "Month": txn_time.month,
            "Day_of_Week": txn_time.weekday(),
            "Hour": txn_time.hour,
        }
        df = pd.DataFrame([row])
        return df[XGB_FEATURE_ORDER]

    def predict(
        self,
        amount: float,
        merchant: str,
        location: str,
        device: str,
        card_type: str,
        txn_time: datetime,
        previous_fraud: int = 0,
    ) -> float:
        """
        Run fraud prediction on a single transaction.

        Returns:
            Fraud probability between 0.0 and 1.0.
            Returns 0.0 as fallback if model is not loaded.
        """
        if self.model is None:
            logger.warning("XGBoost model not loaded, returning fallback score 0.0")
            return 0.0

        features = self._build_features(
            amount=amount,
            merchant=merchant,
            location=location,
            device=device,
            card_type=card_type,
            txn_time=txn_time,
            previous_fraud=previous_fraud,
        )

        try:
            probability = self.model.predict_proba(features)[0][1]
            return round(float(probability), 6)
        except Exception as e:
            logger.error(f"XGBoost prediction failed: {e}")
            return 0.0

    @property
    def is_loaded(self) -> bool:
        return self._loaded
