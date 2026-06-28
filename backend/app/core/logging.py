"""
FraudGuard AI — Structured Logging

Replaces all print() statements with proper structured logging.
Uses Python's built-in logging with a clean JSON-friendly formatter.
"""

import logging
import sys
from datetime import datetime, timezone


class FraudGuardFormatter(logging.Formatter):
    """Custom formatter that produces structured, readable log lines."""

    LEVEL_COLORS = {
        "DEBUG": "🔍",
        "INFO": "✅",
        "WARNING": "⚠️",
        "ERROR": "❌",
        "CRITICAL": "🔴",
    }

    def format(self, record: logging.LogRecord) -> str:
        icon = self.LEVEL_COLORS.get(record.levelname, "📋")
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        return f"{icon} [{timestamp}] [{record.name}] {record.getMessage()}"


def setup_logging(level: int = logging.INFO) -> logging.Logger:
    """Configure and return the application root logger."""
    logger = logging.getLogger("fraudguard")
    logger.setLevel(level)

    # Avoid duplicate handlers on reload
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(FraudGuardFormatter())
        logger.addHandler(handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """Get a child logger for a specific module."""
    return logging.getLogger(f"fraudguard.{name}")
