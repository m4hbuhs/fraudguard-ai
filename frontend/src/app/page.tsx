import { AppShell } from "@/components/layout/AppShell"
import { KPICard } from "@/components/dashboard/KPICard"
import { FraudRateChart } from "@/components/dashboard/FraudRateChart"
import { AlertFeed } from "@/components/dashboard/AlertFeed"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { Activity, ShieldAlert, BadgeDollarSign, ShieldCheck } from "lucide-react"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils"
import { fetchDashboardMetrics, fetchFraudTrend, fetchAlerts, fetchRecentTransactions } from "@/lib/api"

// Ensure this page is rendered dynamically to fetch fresh data
export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: Promise<{ search?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const searchQuery = params.search || "";

  // Fetch data in parallel — fetch more transactions when searching
  const [m, trend, alerts, transactions] = await Promise.all([
    fetchDashboardMetrics().catch(() => null),
    fetchFraudTrend(30).catch(() => ({ data: [] })),
    fetchAlerts(5).catch(() => []),
    fetchRecentTransactions(searchQuery ? 100 : 20).catch(() => [])
  ]);

  // Client-side search filtering
  const filteredTransactions = searchQuery
    ? (Array.isArray(transactions) ? transactions : []).filter((txn: any) => {
        const q = searchQuery.toLowerCase();
        return (
          (txn.transaction_id || "").toLowerCase().includes(q) ||
          (txn.customer_id || "").toLowerCase().includes(q) ||
          (txn.merchant || "").toLowerCase().includes(q) ||
          (txn.location || "").toLowerCase().includes(q)
        );
      })
    : transactions;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Evaluation Hub</h1>
          <p className="text-muted-foreground mt-1">
            Real-time telemetry from the Hybrid AI Pipeline and Compliance Nodes.
          </p>
          {!m && (
             <div className="mt-4 p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
               <ShieldAlert className="h-4 w-4" />
               Warning: Cannot connect to the FastAPI backend at localhost:8000. Displaying partial or empty data.
             </div>
          )}
          {searchQuery && (
            <div className="mt-4 p-3 rounded-md bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2">
              Showing results for &quot;{searchQuery}&quot; — {filteredTransactions.length} match(es) found.
            </div>
          )}
        </div>

        {/* KPI Cards */}
        {m && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Transactions Scanned"
              value={formatNumber(m.total_transactions)}
              icon={Activity}
              description={`+${m.transactions_today} today`}
            />
            <KPICard
              title="System Fraud Rate"
              value={formatPercent(m.fraud_rate)}
              icon={ShieldAlert}
              trend={0.12}
              trendLabel="vs last week"
            />
            <KPICard
              title="False Positive Estimate"
              value={formatPercent(m.false_positive_rate)}
              icon={ShieldCheck}
              trend={-0.05}
              trendLabel="vs last week"
            />
            <KPICard
              title="Revenue Protected"
              value={formatCurrency(m.revenue_saved)}
              icon={BadgeDollarSign}
              description="Total saved"
            />
          </div>
        )}

        {/* Charts & Alerts */}
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-7">
          <FraudRateChart data={trend.data} />
          <AlertFeed alerts={alerts} />
        </div>

        {/* Data Table */}
        <RecentTransactions transactions={filteredTransactions} />
      </div>
    </AppShell>
  )
}
