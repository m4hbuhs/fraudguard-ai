"""
FraudGuard AI — Chat API Routes

Forensic investigation chat powered by RAG.
"""

from fastapi import APIRouter

from app.models.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["Chat"])


def _get_investigator():
    """Lazy import to access the investigator from app state."""
    from app.main import investigator
    return investigator


@router.post("/investigate", response_model=ChatResponse)
def chat_investigation(payload: ChatRequest):
    """
    Conversational forensic audit session.
    Allows analysts to query compliance regulations about a specific case.
    """
    inv = _get_investigator()
    if inv is None:
        return ChatResponse(
            reply="RAG investigator is not available. Please check server configuration.",
            sources=[],
        )

    reply = inv.converse(
        user_message=payload.message,
        chat_history=[msg.model_dump() for msg in payload.chat_history],
        txn_context=payload.transaction_context or {},
    )

    return ChatResponse(reply=reply, sources=["compliance_rules.txt"])
