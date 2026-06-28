const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchDashboardMetrics() {
  const res = await fetch(`${API_BASE_URL}/metrics/dashboard`, { next: { revalidate: 10 } });
  if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
  return res.json();
}

export async function fetchFraudTrend(days: number = 30) {
  const res = await fetch(`${API_BASE_URL}/metrics/fraud-trend?days=${days}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch fraud trend");
  return res.json();
}

export async function fetchRecentTransactions(limit: number = 10) {
  const res = await fetch(`${API_BASE_URL}/transactions/recent?page_size=${limit}`, { next: { revalidate: 5 } });
  if (!res.ok) throw new Error("Failed to fetch recent transactions");
  const data = await res.json();
  return data.transactions || [];
}

export async function fetchAlerts(limit: number = 5) {
  const res = await fetch(`${API_BASE_URL}/alerts?page_size=${limit}`, { next: { revalidate: 5 } });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  const data = await res.json();
  return data.alerts || [];
}

export async function fetchModelPerformance() {
  const res = await fetch(`${API_BASE_URL}/metrics/model-performance`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to fetch model performance");
  return res.json();
}
