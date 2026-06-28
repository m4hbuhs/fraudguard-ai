# FraudGuard AI — System Architecture & Documentation

## 1. Project Overview & Capabilities

**FraudGuard AI** is an enterprise-grade financial fraud detection platform designed to evaluate high-frequency transaction streams in real-time. It provides risk analysts with a comprehensive dashboard to monitor alerts, investigate flagged transactions, and evaluate new events on the fly.

### The Hybrid Inference Setup
FraudGuard AI differentiates itself by employing a **Dual-Engine Hybrid Inference** approach:
*   **Tabular Machine Learning (XGBoost):** Processes discrete, point-in-time transaction features (Amount, Merchant, Location, Device, Card Type) to identify traditional fraud markers and rule-based anomalies.
*   **Sequential Deep Learning (PyTorch LSTM):** Processes a customer's historical transaction sequence as a time-series tensor. This allows the system to detect subtle, temporal fraud patterns (e.g., velocity attacks, rapid location shifting) that tabular models often miss.

These two models run concurrently, and their outputs are synthesized by an **Ensemble Scorer** that applies configurable weights to determine the final probability of fraud, classifying it into actionable risk tiers (LOW, MEDIUM, HIGH, CRITICAL).

---

## 2. Enterprise System Architecture

The system operates across a modernized, decoupled architecture:

### Data Flow Pipeline
1.  **Intake & Submission (Frontend):** 
    Analysts submit manual transactions via the Next.js UI dashboard or external services hit the FastAPI REST endpoints.
2.  **Processing & Ingestion (Backend):** 
    The FastAPI service intercepts the payload, validating the schema via Pydantic. It automatically queries the PostgreSQL database via SQLAlchemy to fetch the customer profile and historical transaction context.
3.  **Dual-Engine Inference Pipeline:**
    *   The `FeaturePipeline` normalizes the raw data using `scikit-learn` artifacts (Scalers/Encoders) and pads historical sequences for the LSTM.
    *   The `XGBoostInferenceEngine` and `LSTMInferenceEngine` execute simultaneously.
    *   The `EnsembleScorer` aggregates the results.
4.  **GenAI/RAG Auditing Layer:**
    If a transaction is flagged as fraud, the `RAGInvestigator` service is triggered. It uses **LangChain** and a local **FAISS** vector store to semantically search `compliance_rules.txt`. It then prompts the **Gemini LLM** to generate a human-readable, compliance-backed audit explanation.
5.  **Client Telemetry & Persistence:**
    The final evaluation, including the AI explanation and independent model scores, is persisted to PostgreSQL and streamed back to the Next.js App Router client to render the UI components.

---

## 3. File Structure & Directory Tree Map

```text
c:\Users\Shubham\Project\
├── backend/                       # Python FastAPI Backend Services
│   ├── .env                       # Environment variables (DB URLs, API Keys, Model weights)
│   ├── main.py                    # Uvicorn entry point & FastAPI application lifecycle
│   ├── config.py                  # Pydantic BaseSettings for global configuration
│   ├── requirements.txt           # Python dependency manifests
│   ├── seed_db.py                 # Script to generate 100k synthetic transactions
│   ├── backfill_scores.py         # Migration script to backfill risk scores on historical data
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── transactions.py    # REST router endpoints (e.g., /evaluate, /recent, /{id})
│   │   ├── core/
│   │   │   ├── database.py        # SQLAlchemy engine, SessionLocal, and dependency injection
│   │   │   └── logging.py         # Custom structured JSON-friendly logger
│   │   ├── engine/
│   │   │   ├── ensemble.py        # RiskResult dataclass and weighted scoring logic
│   │   │   ├── feature_pipeline.py# scikit-learn transformations & LSTM tensor padding
│   │   │   ├── lstm.py            # PyTorch nn.Module definitions and model loading
│   │   │   └── xgboost_engine.py  # Tabular feature construction and joblib model execution
│   │   ├── models/
│   │   │   ├── database.py        # SQLAlchemy ORM definitions (UserProfile, TransactionRecord)
│   │   │   └── schemas.py         # Pydantic validation schemas (RiskAssessment, etc.)
│   │   └── services/
│   │       ├── investigator.py    # RAG orchestration via LangChain + FAISS + Gemini
│   │       └── transaction_service.py # Core business logic pipeline bridging models & DB
│
├── frontend/                      # React Next.js (App Router) Frontend
│   ├── package.json               # Node dependency manifests
│   ├── tailwind.config.ts         # Utility CSS framework configuration
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Main Dashboard View (Server Component w/ client-side filtering)
│   │   │   ├── layout.tsx         # Global AppShell wrapper
│   │   │   ├── alerts/            # High-risk transaction feed
│   │   │   ├── insights/          # Model performance and metric visualization
│   │   │   └── investigate/       # RAG chat interface for forensic accounting
│   │   │
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── AddTransactionModal.tsx # Form to trigger POST /evaluate
│   │   │   │   ├── AlertFeed.tsx       # Live feed of highest risk transactions
│   │   │   │   └── RecentTransactions.tsx # Data table for general ledger
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx          # Navigation, Search Bar, Notification Bell Dropdown
│   │   │   │   └── Sidebar.tsx         # Primary application navigation
│   │   │   └── ui/                     # Shadcn UI primitives (Cards, Badges, Inputs, Buttons)
│   │   │
│   │   └── lib/
│   │       ├── api.ts             # Fetch wrappers to communicate with backend FastAPI
│   │       └── utils.ts           # Helper functions (currency formatting, risk colors)
│
├── data/
│   ├── compliance_rules.txt       # Raw text regulations used for RAG semantic search
│   └── faiss_index/               # Compiled vector store database
│
└── models/                        # Serialized ML artifacts
    ├── lstm_model.pth             # PyTorch weights
    ├── model.pkl                  # XGBoost pipeline
    └── *_scaler/encoders.pkl      # Preprocessing artifacts
```

---

## 4. Component & Engine Breakdowns

### Dual Inference Execution
*   **PyTorch LSTM (`app.engine.lstm`):** 
    The `FraudLSTM` inherits from `nn.Module`. It expects an input tensor of shape `(1, seq_length, num_features)`. The `FeaturePipeline` queries the database for the user's most recent transactions, encodes them, and pads the sequence with zeros if they lack sufficient history (Cold-Start handling). The LSTM processes this sequential tensor to output a single temporal risk probability.
*   **XGBoost Engine (`app.engine.xgboost_engine`):**
    Constructs a tabular DataFrame explicitly matching the schema of the training environment. It immediately calculates derived features (like extracting the Day, Month, and Hour from the transaction timestamp) before running the standard `predict_proba()` method to generate a point-in-time risk score.

### Dynamic "Create-on-the-Fly" Registration
To handle vast influxes of telemetry from arbitrary endpoints, the `transaction_service.py` implements a resilient ingestion strategy. When a transaction arrives at the `/evaluate` route with an unrecognized `customer_id`:
1.  The system intercepts the ORM query result (checking `UserProfile`).
2.  If it returns `None`, it automatically instantiates a new baseline profile.
3.  The profile is seeded with an `Active` status and standard credit limit, and mapped to the transaction's origin location.
4.  The system flushes the session to assign the ID, preventing Foreign Key constraint failures, and continues the AI pipeline seamlessly.

### RAG Investigator Layer
The `RAGInvestigator` (`app.services.investigator`) is initialized centrally in the FastAPI application state to preserve memory.
1.  **Vectorization:** On startup, it parses `data/compliance_rules.txt`, embedding the regulations using `GoogleGenerativeAIEmbeddings`, and saves the index locally via **FAISS**.
2.  **Retrieval:** When the Ensemble Scorer flags a transaction, the investigator performs a similarity search against the FAISS index using the transaction context (merchant, location) to fetch the top `k=2` relevant compliance rules.
3.  **Generation:** Using **LangChain**, it constructs a `ChatPromptTemplate` that forces the **Gemini LLM** to cite the retrieved rules and explain precisely *why* the transaction violated them, appending this response natively to the database record as the `ai_audit_explanation`.
