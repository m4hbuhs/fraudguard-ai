import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getStatusColor } from "@/lib/utils"

export function RecentTransactions({ transactions }: { transactions: any[] }) {
  // Defensive check
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Global Transaction Stream</CardTitle>
        <CardDescription>Live feed of all processed events</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Reference ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">System Assessment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeTransactions.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                   No transactions loaded.
                 </TableCell>
               </TableRow>
            ) : (
              safeTransactions.map((txn) => (
              <TableRow key={txn.transaction_id} className="border-border/20">
                <TableCell className="font-mono font-medium text-muted-foreground">
                  {txn.transaction_id}
                </TableCell>
                <TableCell>{txn.customer_id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{txn.merchant}</span>
                    <span className="text-xs text-muted-foreground">{txn.location}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(txn.amount)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(txn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={getStatusColor(txn.status)}>
                    {txn.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
