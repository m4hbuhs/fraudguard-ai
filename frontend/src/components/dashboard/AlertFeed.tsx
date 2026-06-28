import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getRiskBgColor, timeAgo } from "@/lib/utils"
import { ShieldAlert } from "lucide-react"

export function AlertFeed({ alerts }: { alerts: any[] }) {
  // Defensive check to ensure alerts is actually an array
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  return (
    <Card className="col-span-full xl:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          Critical Alerts Feed
        </CardTitle>
        <CardDescription>Latest high-risk transactions flagged by ensemble engine</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {safeAlerts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded-lg">
              No recent alerts found.
            </div>
          ) : (
            safeAlerts.map((alert) => (
            <div
              key={alert.transaction_id}
              className="flex flex-col gap-2 rounded-lg border border-border/50 bg-secondary/20 p-4 transition-all hover:bg-secondary/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-foreground">
                    {alert.transaction_id}
                  </span>
                  <Badge variant="outline" className={getRiskBgColor(alert.risk_level)}>
                    {alert.risk_level}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(new Date(alert.timestamp))}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{formatCurrency(alert.amount)}</span>
                  <span className="text-xs text-muted-foreground">{alert.merchant} • {alert.location}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-medium text-primary">
                    {(alert.risk_score * 100).toFixed(1)}% Risk
                  </span>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
