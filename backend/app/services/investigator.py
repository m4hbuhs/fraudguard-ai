"""
FraudGuard AI — RAG Investigator Service

Refactored from the original investigator.py with cleaner structure,
proper error handling, and separated initialization.
"""

import os

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger("services.investigator")


class RAGInvestigator:
    """
    Uses Retrieval-Augmented Generation (RAG) to provide
    compliance-backed explanations for flagged transactions.

    Components:
    - FAISS vector store for compliance document retrieval
    - Gemini LLM for natural language explanation generation
    """

    def __init__(self):
        self.settings = get_settings()
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=self.settings.gemini_embedding_model
        )
        self.llm = ChatGoogleGenerativeAI(
            model=self.settings.gemini_model,
            temperature=0.2,
        )
        self.vector_store = None
        self._initialize_vector_store()

    def _initialize_vector_store(self) -> None:
        """Load or build the FAISS index from compliance documents."""
        index_path = self.settings.faiss_index_path

        if os.path.exists(index_path):
            self.vector_store = FAISS.load_local(
                index_path,
                self.embeddings,
                allow_dangerous_deserialization=True,
            )
            logger.info("FAISS vector store loaded from disk")
        else:
            rules_path = self.settings.compliance_rules_path
            if not os.path.exists(rules_path):
                logger.warning(f"Compliance rules file not found at {rules_path}")
                return

            with open(rules_path, "r", encoding="utf-8") as f:
                docs = [chunk.strip() for chunk in f.read().split("\n\n") if chunk.strip()]

            self.vector_store = FAISS.from_texts(docs, self.embeddings)
            self.vector_store.save_local(index_path)
            logger.info(f"FAISS index built from {len(docs)} compliance documents")

    def generate_audit_explanation(
        self,
        customer_id: str,
        merchant: str,
        amount: float,
        location: str,
    ) -> str:
        """
        Generate a compliance-backed explanation for why a transaction was flagged.
        Uses RAG to ground the explanation in actual regulatory rules.
        """
        if not self.vector_store:
            return "Compliance context unavailable — manual review required."

        query = f"Fraud rules regarding merchant {merchant}, location {location}, and high amounts."
        relevant_docs = self.vector_store.similarity_search(query, k=2)
        context = "\n".join(doc.page_content for doc in relevant_docs)

        prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are an expert AI Fraud Auditor.\n"
                "Review the context regulations to write a concise 2-sentence explanation "
                "detailing exactly why this specific event was flagged.\n\n"
                "COMPLIANCE CONTEXT:\n{context}"
            )),
            ("human", (
                "Analyze transaction: Customer {customer_id} spent ${amount} "
                "at {merchant} in {location}."
            )),
        ])

        chain = prompt | self.llm
        response = chain.invoke({
            "context": context,
            "customer_id": customer_id,
            "amount": amount,
            "merchant": merchant,
            "location": location,
        })
        return response.content

    def converse(
        self,
        user_message: str,
        chat_history: list[dict],
        txn_context: dict,
    ) -> str:
        """
        Conversational follow-up allowing analysts to query compliance
        regulations about a specific case.
        """
        if not self.vector_store:
            return "Compliance context unavailable."

        relevant_docs = self.vector_store.similarity_search(user_message, k=2)
        context = "\n".join(doc.page_content for doc in relevant_docs)

        # Reconstruct LangChain message history
        lc_history = []
        for msg in chat_history:
            if msg.get("role") == "user":
                lc_history.append(HumanMessage(content=msg["content"]))
            else:
                lc_history.append(AIMessage(content=msg["content"]))

        prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are a conversational Forensic Accounting Assistant. "
                "Help the analyst inspect the details of this case using the "
                "provided regulations.\n\n"
                "CASE RECORD:\n{txn_context}\n\n"
                "RELEVANT REGULATIONS:\n{context}"
            )),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ])

        chain = prompt | self.llm
        response = chain.invoke({
            "history": lc_history,
            "context": context,
            "txn_context": str(txn_context),
            "input": user_message,
        })
        return response.content
