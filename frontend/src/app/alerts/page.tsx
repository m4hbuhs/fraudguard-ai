import { AppShell } from "@/components/layout/AppShell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getRiskBgColor, timeAgo } from "@/lib/utils"
import { Filter, ShieldAlert } from "lucide-react"
import { fetchAlerts } from "@/lib/api"

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const alerts = await fetchAlerts(20).catch(() => []);
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security Alerts</h1>
            <p className="text-muted-foreground mt-1">
              Live feed of flagged transactions requiring manual review.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{safeAlerts.length} alerts</span>
          </div>
        </div>

        <div className="grid gap-4">
          {safeAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No flagged transactions found.
              </CardContent>
            </Card>
          ) : (
            safeAlerts.map((alert: any) => (
              <Card key={alert.transaction_id} className="overflow-hidden hover:border-primary/50 transition-colors">
                <div className={`h-1 w-full ${
                  alert.risk_level === 'CRITICAL' ? 'bg-red-500' :
                  alert.risk_level === 'HIGH' ? 'bg-orange-500' :
                  alert.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg font-mono">{alert.transaction_id}</CardTitle>
                      <Badge variant="outline" className={getRiskBgColor(alert.risk_level)}>
                        {alert.risk_level} RISK
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{timeAgo(new Date(alert.timestamp))}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Customer</span>
                      <span className="font-medium">{alert.customer_id}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="font-medium text-lg text-primary">{formatCurrency(alert.amount)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Merchant & Location</span>
                      <span className="font-medium">{alert.merchant} • {alert.location}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Ensemble Risk Score</span>
                      <span className="font-medium font-mono">{(alert.risk_score * 100).toFixed(2)}%</span>
                    </div>
                  </div>

                  {alert.ai_explanation && (
                    <div className="mt-6 rounded-md bg-secondary/30 p-4 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm font-semibold">AI Investigator Audit</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {alert.ai_explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
