"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react"

const merchants = ["MER0145", "MER0089", "MER0234", "MER0567", "MER0321", "MER0078"]
const locations = ["Mumbai", "Varanasi", "New York", "London", "Tokyo", "Berlin", "Dubai", "Singapore"]
const devices = ["iPhone", "Android", "Windows", "Mac", "Linux", "Unknown"]
const cardTypes = ["Visa", "MasterCard", "Amex", "RuPay", "Platinum"]

interface EvalResult {
  transaction_id: string
  status: string
  risk_assessment: {
    risk_score: number
    risk_level: string
    xgb_score: number
    lstm_score: number
    xgb_flagged: boolean
    lstm_flagged: boolean
    triggers: string[]
  }
  ai_audit_explanation: string | null
}

export function AddTransactionModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EvalResult | null>(null)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    transaction_id: `TXN${Date.now().toString().slice(-6)}`,
    customer_id: "",
    amount: "",
    merchant: merchants[0],
    location: locations[0],
    device: devices[0],
    card_type: cardTypes[0],
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
      const res = await fetch(`${baseUrl}/transactions/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      })

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(detail.detail || `Server returned ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Failed to evaluate transaction.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      transaction_id: `TXN${Date.now().toString().slice(-6)}`,
      customer_id: "",
      amount: "",
      merchant: merchants[0],
      location: locations[0],
      device: devices[0],
      card_type: cardTypes[0],
    })
    setResult(null)
    setError("")
  }

  if (!open) {
    return (
      <Button
        onClick={() => { resetForm(); setOpen(true) }}
        className="gap-2"
        size="sm"
      >
        <Plus className="h-4 w-4" />
        Add Transaction
      </Button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-border/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Evaluate New Transaction</CardTitle>
              <CardDescription>
                Submit a transaction through the AI fraud detection pipeline
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {result ? (
              /* ── Result View ─── */
              <div className="space-y-4">
                <div className={`flex items-center gap-3 rounded-lg p-4 ${
                  result.status === "DECLINED" ? "bg-red-500/10 border border-red-500/20" : "bg-emerald-500/10 border border-emerald-500/20"
                }`}>
                  {result.status === "DECLINED" ? (
                    <ShieldAlert className="h-5 w-5 text-red-400" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  )}
                  <div>
                    <p className="font-semibold">{result.status}</p>
                    <p className="text-sm text-muted-foreground">
                      Risk Score: {(result.risk_assessment.risk_score * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {result.risk_assessment.risk_level}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-secondary/30 p-3">
                    <span className="text-muted-foreground">XGBoost</span>
                    <p className="font-mono font-bold">{(result.risk_assessment.xgb_score * 100).toFixed(1)}%</p>
                  </div>
                  <div className="rounded-md bg-secondary/30 p-3">
                    <span className="text-muted-foreground">LSTM</span>
                    <p className="font-mono font-bold">{(result.risk_assessment.lstm_score * 100).toFixed(1)}%</p>
                  </div>
                </div>

                {result.ai_audit_explanation && (
                  <div className="rounded-md bg-secondary/30 p-4 border border-border/50">
                    <p className="text-xs font-semibold text-primary mb-1">AI Audit Explanation</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {result.ai_audit_explanation}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button onClick={resetForm} variant="outline" className="flex-1">
                    Evaluate Another
                  </Button>
                  <Button onClick={() => setOpen(false)} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Form View ─── */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Transaction ID</label>
                    <Input
                      value={form.transaction_id}
                      onChange={(e) => handleChange("transaction_id", e.target.value)}
                      required
                      className="bg-secondary/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Customer ID</label>
                    <Input
                      value={form.customer_id}
                      onChange={(e) => handleChange("customer_id", e.target.value)}
                      placeholder="CUST1234"
                      required
                      className="bg-secondary/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Amount ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={(e) => handleChange("amount", e.target.value)}
                    placeholder="1500.00"
                    required
                    className="bg-secondary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Merchant</label>
                    <select
                      value={form.merchant}
                      onChange={(e) => handleChange("merchant", e.target.value)}
                      className="w-full rounded-md border-0 bg-secondary/30 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary"
                    >
                      {merchants.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Location</label>
                    <select
                      value={form.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      className="w-full rounded-md border-0 bg-secondary/30 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary"
                    >
                      {locations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Device</label>
                    <select
                      value={form.device}
                      onChange={(e) => handleChange("device", e.target.value)}
                      className="w-full rounded-md border-0 bg-secondary/30 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary"
                    >
                      {devices.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Card Type</label>
                    <select
                      value={form.card_type}
                      onChange={(e) => handleChange("card_type", e.target.value)}
                      className="w-full rounded-md border-0 bg-secondary/30 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary"
                    >
                      {cardTypes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Running AI Pipeline...</>
                  ) : (
                    <><ShieldAlert className="h-4 w-4" /> Evaluate Transaction</>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
