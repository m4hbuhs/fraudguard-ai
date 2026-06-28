import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string
  trend?: number
  icon: React.ElementType
  description?: string
  trendLabel?: string
}

export function KPICard({ title, value, trend, icon: Icon, description, trendLabel }: KPICardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(trend !== undefined || description) && (
          <div className="mt-2 flex items-center text-xs">
            {trend !== undefined && (
              <span className={`flex items-center gap-1 font-medium mr-2 ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {trend >= 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
            <span className="text-muted-foreground">{description || trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
