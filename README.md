# FraudGuard AI

### Enterprise Hybrid AI Financial Fraud Detection Platform

FraudGuard AI is an enterprise-grade financial fraud detection platform that combines **Machine Learning**, **Deep Learning**, **Retrieval-Augmented Generation (RAG)**, and **Large Language Models (LLMs)** to detect fraudulent financial transactions in real time while providing explainable, compliance-backed audit reports.

Unlike traditional fraud detection systems that rely on a single prediction model, FraudGuard AI employs a **Dual-Engine Hybrid Inference Architecture**, allowing it to identify both point-in-time anomalies and complex sequential fraud patterns.

---

# Features

* ⚡ Real-time fraud detection
* 🧠 Hybrid AI architecture (XGBoost + PyTorch LSTM)
* 🤖 Explainable AI using Gemini + LangChain
* 📚 Retrieval-Augmented Generation (RAG)
* 🔍 Compliance rule retrieval using FAISS
* 📊 Interactive analyst dashboard built with Next.js
* 🗄 PostgreSQL database with SQLAlchemy ORM
* 🔄 Automatic customer registration during transaction ingestion
* 📈 Enterprise-ready modular architecture

---

#  System Architecture

```
                    ┌──────────────────────────┐
                    │     Next.js Frontend      │
                    │ Dashboard / Alerts / UI   │
                    └─────────────┬─────────────┘
                                  │
                           REST API Calls
                                  │
                    ┌─────────────▼─────────────┐
                    │      FastAPI Backend      │
                    │ Request Validation        │
                    │ Business Logic            │
                    └─────────────┬─────────────┘
                                  │
                      SQLAlchemy + PostgreSQL
                                  │
                    ┌─────────────▼─────────────┐
                    │ Feature Engineering Layer │
                    └──────┬──────────┬─────────┘
                           │          │
                 ┌─────────▼───┐  ┌──▼──────────┐
                 │  XGBoost ML │  │ PyTorch LSTM│
                 └─────────┬───┘  └────┬────────┘
                           │           │
                           └─────┬─────┘
                                 ▼
                      Ensemble Risk Scorer
                                 │
                    ┌────────────▼─────────────┐
                    │ Fraud Probability        │
                    │ Risk Classification      │
                    └────────────┬─────────────┘
                                 │
                          If Fraud Detected
                                 │
                    ┌────────────▼────────────┐
                    │      RAG Investigator    │
                    │ LangChain + FAISS        │
                    │ Gemini LLM               │
                    └────────────┬────────────┘
                                 │
                     Compliance-backed Explanation
                                 │
                    ┌────────────▼─────────────┐
                    │ PostgreSQL + Dashboard   │
                    └──────────────────────────┘
```

---

#  Hybrid Inference Engine

FraudGuard AI evaluates every transaction using two independent AI models running simultaneously.

## 1. XGBoost Engine

The XGBoost model analyzes structured transaction data such as:

* Transaction Amount
* Merchant
* Device Type
* Location
* Card Type
* Transaction Time
* Derived temporal features

This model specializes in identifying traditional fraud indicators and point-in-time anomalies.

---

## 2. PyTorch LSTM Engine

The LSTM model evaluates customer transaction history as a sequential time series.

Instead of examining only the current transaction, it learns behavioral patterns such as:

* Rapid transaction velocity
* Location switching
* Spending behavior
* Sequential fraud attacks
* Temporal anomalies

Customer history is automatically fetched from PostgreSQL, encoded, padded, and converted into tensors before inference.

---

## 3. Ensemble Scoring

Both prediction engines execute concurrently.

```
Final Risk Score =
(XGBoost Score × Weight)
+
(LSTM Score × Weight)
```

The final probability is converted into actionable risk categories:

| Risk Score  | Classification |
| ----------- | -------------- |
| 0 – 0.30    | LOW            |
| 0.30 – 0.60 | MEDIUM         |
| 0.60 – 0.85 | HIGH           |
| > 0.85      | CRITICAL       |

---

#  Explainable AI (RAG)

Traditional fraud detection systems simply output:

> Fraud = True

FraudGuard AI explains **why** the transaction was flagged.

The RAG Investigator performs:

1. Semantic search over financial compliance rules
2. Retrieves relevant regulations using FAISS
3. Sends retrieved context to Gemini through LangChain
4. Generates a human-readable audit report

Example output:

> The transaction exhibits unusually high velocity combined with a significant geographic deviation from the customer's historical profile. This behavior aligns with Compliance Rule 3.2 regarding suspicious transactional anomalies and Rule 5.1 concerning rapid cross-region payment activity.

This explanation is stored alongside every flagged transaction.

---

#  Complete Processing Pipeline

## Step 1 — Transaction Submission

Transactions can originate from:

* Next.js Dashboard
* External REST API clients

---

## Step 2 — Request Validation

FastAPI validates incoming payloads using Pydantic schemas.

---

## Step 3 — Customer Lookup

The backend retrieves:

* Customer profile
* Historical transactions
* Previous fraud history

using SQLAlchemy.

---

## Step 4 — Feature Engineering

The Feature Pipeline:

* Encodes categorical variables
* Scales numerical values
* Extracts temporal features
* Pads historical sequences for LSTM inference

---

## Step 5 — Dual AI Inference

Both AI engines execute simultaneously.

```
             Transaction
                  │
      ┌───────────┴───────────┐
      │                       │
 XGBoost Engine         LSTM Engine
      │                       │
      └───────────┬───────────┘
                  │
          Ensemble Scoring
```

---

## Step 6 — Risk Classification

The Ensemble Scorer generates:

* Fraud probability
* Risk tier
* Individual model scores

---

## Step 7 — RAG Investigation

For fraudulent transactions:

* Retrieve compliance rules
* Query Gemini
* Generate audit explanation

---

## Step 8 — Database Persistence

The system stores:

* Transaction
* Risk score
* XGBoost prediction
* LSTM prediction
* AI explanation
* Timestamp

---

## Step 9 — Dashboard Update

The frontend immediately displays:

* Recent transactions
* Live fraud alerts
* Risk badges
* AI explanations

---

#  Project Structure

```
FraudGuardAI/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── engine/
│   │   ├── models/
│   │   └── services/
│   │
│   ├── seed_db.py
│   ├── backfill_scores.py
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│
├── models/
│   ├── model.pkl
│   ├── lstm_model.pth
│   └── preprocessing artifacts
│
├── data/
│   ├── compliance_rules.txt
│   └── faiss_index/
│
└── README.md
```

---

# 🛠 Technology Stack

## Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* Pydantic

## Machine Learning

* XGBoost
* Scikit-learn
* Joblib

## Deep Learning

* PyTorch
* LSTM

## Explainable AI

* LangChain
* Google Gemini
* FAISS

## Frontend

* Next.js (App Router)
* React
* Tailwind CSS
* Shadcn UI

---

#  Core Components

## Feature Pipeline

Responsible for:

* Feature scaling
* Encoding
* Tensor preparation
* Sequence padding

---

## XGBoost Engine

Responsible for:

* Structured feature inference
* Probability estimation

---

## LSTM Engine

Responsible for:

* Sequential fraud detection
* Behavioral anomaly recognition

---

## Ensemble Scorer

Responsible for:

* Combining model outputs
* Risk tier assignment
* Final fraud probability

---

## RAG Investigator

Responsible for:

* Compliance retrieval
* Vector search
* AI explanation generation

---

#  Automatic Customer Registration

If an incoming transaction references an unknown customer:

1. A new customer profile is automatically created.
2. Default account values are assigned.
3. Foreign key relationships are established.
4. The fraud detection pipeline continues without interruption.

This enables seamless ingestion of transactions from previously unseen users.

---

#  Database

The PostgreSQL database stores:

* Customer Profiles
* Transaction History
* Risk Scores
* Fraud Labels
* AI Audit Reports
* Historical Predictions

---

#  Future Improvements

* Kafka event streaming
* Redis caching
* Docker & Kubernetes deployment
* Role-based authentication
* Real-time WebSocket alerts
* Model retraining pipeline
* SHAP feature importance visualization
* Grafana monitoring
* CI/CD with GitHub Actions
* Multi-model ensemble optimization

---

#  License

This project is intended for educational and portfolio purposes. It demonstrates the design and implementation of an enterprise-scale AI-powered fraud detection system using modern machine learning, deep learning, and Generative AI technologies.
