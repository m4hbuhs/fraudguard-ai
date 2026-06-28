// FraudGuard AI — Comprehensive Mock Data Layer
// Provides realistic data so the dashboard is fully functional without the backend

export interface Transaction {
  transaction_id: string;
  customer_id: string;
  amount: number;
  merchant: string;
  location: string;
  device: string;
  card_type: string;
  time: string;
  status: "APPROVED" | "DECLINED" | "UNDER_REVIEW" | "BLOCKED";
  risk_score: number | null;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null;
  xgb_score: number | null;
  lstm_score: number | null;
  ai_audit_explanation: string | null;
}

export interface Alert {
  transaction_id: string;
  customer_id: string;
  amount: number;
  merchant: string;
  location: string;
  risk_score: number;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  timestamp: string;
  ai_explanation: string | null;
}

export interface DashboardMetrics {
  total_transactions: number;
  total_flagged: number;
  fraud_rate: number;
  false_positive_rate: number;
  revenue_saved: number;
  transactions_today: number;
  flagged_today: number;
}

export interface FraudTrendPoint {
  date: string;
  total: number;
  flagged: number;
  rate: number;
}

export interface ModelPerformance {
  roc_auc: number;
  precision: number;
  recall: number;
  f1_score: number;
  accuracy: number;
  training_date: string;
  dataset_size: number;
  roc_curve: { fpr: number; tpr: number }[];
  precision_recall_curve: { recall: number; precision: number }[];
  feature_importance: { feature: string; importance: number }[];
  confusion_matrix: {
    true_positives: number;
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
  };
}

// ── Mock Dashboard Metrics ───────────────────────────────────

export const mockDashboardMetrics: DashboardMetrics = {
  total_transactions: 148_329,
  total_flagged: 2_847,
  fraud_rate: 1.92,
  false_positive_rate: 0.23,
  revenue_saved: 4_238_750,
  transactions_today: 1_247,
  flagged_today: 23,
};

// ── Mock Fraud Trend ─────────────────────────────────────────

export const mockFraudTrend: FraudTrendPoint[] = Array.from(
  { length: 30 },
  (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const total = 3800 + Math.floor(Math.random() * 1200);
    const flagged = 45 + Math.floor(Math.random() * 55);
    return {
      date: date.toISOString().split("T")[0],
      total,
      flagged,
      rate: parseFloat(((flagged / total) * 100).toFixed(2)),
    };
  }
);

// ── Mock Transactions ────────────────────────────────────────

const merchants = [
  "MER0145",
  "MER0089",
  "MER0234",
  "MER0567",
  "MER0321",
  "MER0078",
  "MER0412",
  "MER0199",
];
const locations = [
  "Mumbai",
  "Varanasi",
  "New York",
  "London",
  "Tokyo",
  "Berlin",
  "Dubai",
  "Singapore",
];
const devices = ["iPhone", "Android", "Windows", "Mac"];
const cardTypes = ["Visa", "MasterCard", "Amex", "RuPay"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const mockTransactions: Transaction[] = Array.from(
  { length: 50 },
  (_, i) => {
    const isFraud = Math.random() < 0.15;
    const riskScore = isFraud
      ? 0.65 + Math.random() * 0.35
      : Math.random() * 0.4;
    const riskLevel = riskScore >= 0.85
      ? "CRITICAL"
      : riskScore >= 0.7
        ? "HIGH"
        : riskScore >= 0.5
          ? "MEDIUM"
          : "LOW";

    const date = new Date();
    date.setMinutes(date.getMinutes() - i * 7 - Math.floor(Math.random() * 30));

    return {
      transaction_id: `TXN${String(50000 + i).padStart(5, "0")}`,
      customer_id: `CUST${String(1000 + Math.floor(Math.random() * 9000)).padStart(5, "0")}`,
      amount: isFraud
        ? 2000 + Math.floor(Math.random() * 18000)
        : 10 + Math.floor(Math.random() * 3000),
      merchant: randomItem(merchants),
      location: randomItem(locations),
      device: randomItem(devices),
      card_type: randomItem(cardTypes),
      time: date.toISOString(),
      status: isFraud ? "DECLINED" : "APPROVED",
      risk_score: parseFloat(riskScore.toFixed(4)),
      risk_level: riskLevel,
      xgb_score: parseFloat(
        (riskScore + (Math.random() - 0.5) * 0.15).toFixed(4)
      ),
      lstm_score: parseFloat(
        (riskScore + (Math.random() - 0.5) * 0.15).toFixed(4)
      ),
      ai_audit_explanation: isFraud
        ? `This transaction was flagged due to an unusually high amount of $${(2000 + Math.floor(Math.random() * 18000)).toLocaleString()} at merchant ${randomItem(merchants)}, combined with a geographic location shift from the customer's registered home location. The pattern matches REG-002 velocity anomaly criteria.`
        : null,
    };
  }
);

// ── Mock Alerts ──────────────────────────────────────────────

export const mockAlerts: Alert[] = mockTransactions
  .filter((t) => t.status === "DECLINED")
  .map((t) => ({
    transaction_id: t.transaction_id,
    customer_id: t.customer_id,
    amount: t.amount,
    merchant: t.merchant,
    location: t.location,
    risk_score: t.risk_score!,
    risk_level: t.risk_level as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    timestamp: t.time,
    ai_explanation: t.ai_audit_explanation,
  }));

// ── Mock Model Performance ───────────────────────────────────

export const mockModelPerformance: ModelPerformance = {
  roc_auc: 0.943,
  precision: 0.891,
  recall: 0.867,
  f1_score: 0.879,
  accuracy: 0.952,
  training_date: "2026-06-15",
  dataset_size: 50000,
  roc_curve: [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.02, tpr: 0.45 },
    { fpr: 0.05, tpr: 0.68 },
    { fpr: 0.08, tpr: 0.78 },
    { fpr: 0.10, tpr: 0.83 },
    { fpr: 0.15, tpr: 0.88 },
    { fpr: 0.20, tpr: 0.91 },
    { fpr: 0.30, tpr: 0.94 },
    { fpr: 0.40, tpr: 0.96 },
    { fpr: 0.60, tpr: 0.98 },
    { fpr: 0.80, tpr: 0.99 },
    { fpr: 1.0, tpr: 1.0 },
  ],
  precision_recall_curve: [
    { recall: 0.0, precision: 1.0 },
    { recall: 0.1, precision: 0.97 },
    { recall: 0.2, precision: 0.95 },
    { recall: 0.3, precision: 0.94 },
    { recall: 0.4, precision: 0.93 },
    { recall: 0.5, precision: 0.92 },
    { recall: 0.6, precision: 0.91 },
    { recall: 0.7, precision: 0.89 },
    { recall: 0.8, precision: 0.86 },
    { recall: 0.9, precision: 0.8 },
    { recall: 0.95, precision: 0.72 },
    { recall: 1.0, precision: 0.55 },
  ],
  feature_importance: [
    { feature: "Amount", importance: 0.28 },
    { feature: "Previous Fraud", importance: 0.22 },
    { feature: "Location", importance: 0.15 },
    { feature: "Merchant", importance: 0.12 },
    { feature: "Hour", importance: 0.08 },
    { feature: "Device", importance: 0.06 },
    { feature: "Day of Week", importance: 0.04 },
    { feature: "Card Type", importance: 0.03 },
    { feature: "Month", importance: 0.02 },
  ],
  confusion_matrix: {
    true_positives: 4335,
    true_negatives: 43265,
    false_positives: 520,
    false_negatives: 880,
  },
};
