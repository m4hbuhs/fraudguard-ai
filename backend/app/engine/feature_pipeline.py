"""
FraudGuard AI — Feature Pipeline

Handles the transformation of raw transaction records into
model-ready feature tensors for the LSTM engine.

Migrated and refactored from the root-level feature_store.py.
"""

import numpy as np
import torch
import joblib

from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.logging import get_logger
from app.models.database import TransactionRecord

logger = get_logger("engine.feature_pipeline")


class FeaturePipeline:
    """
    Transforms raw transaction data into LSTM-ready tensors.

    Handles:
    - Loading preprocessing artifacts (scaler, encoders)
    - Querying recent transaction sequences from the database
    - Cold-start padding for new customers
    - Feature normalization and encoding
    """

    def __init__(self):
        self.settings = get_settings()
        self.scaler = None
        self.encoders = None
        self._load_preprocessors()

    def _load_preprocessors(self) -> None:
        """Load training-time preprocessing artifacts."""
        try:
            self.scaler = joblib.load(self.settings.amount_scaler_path)
            self.encoders = joblib.load(self.settings.categorical_encoders_path)
            logger.info("Preprocessing artifacts loaded (scaler + encoders)")
        except FileNotFoundError:
            logger.warning(
                "Preprocessing artifacts not found — using fallback transformations. "
                "This is expected during initial setup."
            )

    def _encode_features(self, txn: TransactionRecord) -> list[float]:
        """
        Transform a single transaction into a numeric feature vector.

        Feature vector: [scaled_amount, enc_merchant, enc_location, enc_device, previous_fraud, enc_card]
        """
        if self.scaler and self.encoders:
            scaled_amount = float(self.scaler.transform([[txn.amount]])[0][0])
            enc_merchant = float(self.encoders["merchant"].transform([txn.merchant])[0])
            enc_location = float(self.encoders["location"].transform([txn.location])[0])
            enc_device = float(self.encoders["device"].transform([txn.device])[0])
            enc_card = float(self.encoders["card_type"].transform([txn.card_type])[0])
        else:
            # Fallback: simple normalization for structural testing
            scaled_amount = float(txn.amount) / 1000.0
            enc_merchant = 1.0
            enc_location = 1.0
            enc_device = 1.0
            enc_card = 1.0

        return [
            scaled_amount,
            enc_merchant,
            enc_location,
            enc_device,
            float(txn.previous_fraud or 0),
            enc_card,
        ]

    def get_sequence_tensor(
        self, db: Session, customer_id: str
    ) -> torch.Tensor:
        """
        Fetch the most recent transactions for a customer and convert
        them into an LSTM-ready tensor.

        Args:
            db: Active database session
            customer_id: Customer identifier

        Returns:
            Tensor of shape (1, seq_length, num_features)
        """
        seq_length = self.settings.lstm_sequence_length
        num_features = self.settings.lstm_input_features

        # Query recent transactions in reverse chronological order
        raw_txns = (
            db.query(TransactionRecord)
            .filter(TransactionRecord.customer_id == customer_id)
            .order_by(TransactionRecord.time.desc())
            .limit(seq_length)
            .all()
        )

        # Reverse to chronological order (oldest → newest)
        raw_txns = list(reversed(raw_txns))

        # Encode each transaction
        features = [self._encode_features(txn) for txn in raw_txns]

        # Cold-start handling: pad with zeros if insufficient history
        if len(features) < seq_length:
            padding = np.zeros((seq_length - len(features), num_features))
            if features:
                matrix = np.vstack([padding, np.array(features)])
            else:
                matrix = padding
        else:
            matrix = np.array(features)

        return torch.tensor(matrix, dtype=torch.float32).unsqueeze(0)
