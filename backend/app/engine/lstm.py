"""
FraudGuard AI — LSTM Inference Engine

Isolated LSTM model definition and inference logic.
Extracted from the monolithic app.py for clean separation of concerns.
"""

import torch
import torch.nn as nn

from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger("engine.lstm")


class FraudLSTM(nn.Module):
    """
    LSTM-based sequence model for detecting fraud patterns
    across a customer's recent transaction history.

    Architecture:
        Input → LSTM (2 layers) → FC → Sigmoid → Risk Probability
    """

    def __init__(
        self,
        input_size: int = 6,
        hidden_size: int = 32,
        num_layers: int = 2,
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(
            input_size, hidden_size, num_layers, batch_first=True
        )
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size, device=x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size, device=x.device)
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])


class LSTMInferenceEngine:
    """
    Manages LSTM model lifecycle: loading weights, running inference,
    and converting raw logits to calibrated probabilities.
    """

    def __init__(self):
        self.settings = get_settings()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = FraudLSTM(input_size=self.settings.lstm_input_features)
        self._loaded = False

    def load(self) -> None:
        """Load model weights from disk."""
        try:
            checkpoint = torch.load(
                self.settings.lstm_model_path,
                map_location=self.device,
                weights_only=True,
            )
            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                self.model.load_state_dict(checkpoint["model_state_dict"])
            else:
                self.model.load_state_dict(checkpoint)

            self.model.to(self.device)
            self.model.eval()
            self._loaded = True
            logger.info(f"LSTM model loaded on {self.device}")
        except Exception as e:
            logger.warning(f"LSTM model loading skipped: {e}")
            self.model.to(self.device)
            self.model.eval()

    def predict(self, input_tensor: torch.Tensor) -> float:
        """
        Run inference on a sequence tensor.

        Args:
            input_tensor: Shape (1, seq_length, num_features)

        Returns:
            Fraud probability between 0.0 and 1.0
        """
        with torch.no_grad():
            input_tensor = input_tensor.to(self.device)
            logits = self.model(input_tensor)
            probability = torch.sigmoid(logits).item()
        return round(probability, 6)

    @property
    def is_loaded(self) -> bool:
        return self._loaded
