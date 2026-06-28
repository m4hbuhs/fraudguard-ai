"use client"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, ShieldQuestion, User, Search, Loader2, AlertTriangle } from "lucide-react"

interface TxnContext {
  transaction_id: string
  customer_id: string
  amount: number
  merchant: string
  location: string
  risk_score: number | null
  risk_level: string | null
}

export default function InvestigatePage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello. I am the AI Investigator. I can analyze specific transactions against our compliance database (REG-001 through REG-004). Link a Transaction ID from the sidebar to begin, or ask a general question."
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [txnSearch, setTxnSearch] = useState("")
  const [txnContext, setTxnContext] = useState<TxnContext | null>(null)
  const [txnLoading, setTxnLoading] = useState(false)
  const [txnError, setTxnError] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Fetch a transaction by ID for context
  const handleLinkTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txnSearch.trim()) return

    setTxnLoading(true)
    setTxnError("")
    setTxnContext(null)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
      const res = await fetch(`${baseUrl}/transactions/${txnSearch.trim()}`)

      if (!res.ok) {
        if (res.status === 404) throw new Error("Transaction not found")
        throw new Error(`Server returned ${res.status}`)
      }

      const data = await res.json()
      setTxnContext({
        transaction_id: data.transaction_id,
        customer_id: data.customer_id,
        amount: data.amount,
        merchant: data.merchant,
        location: data.location,
        risk_score: data.risk_score,
        risk_level: data.risk_level,
      })

      // Notify the chat that context has been linked
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Transaction ${data.transaction_id} has been linked to this session. Customer ${data.customer_id} — $${data.amount.toLocaleString()} at ${data.merchant} (${data.location}). Risk: ${data.risk_level || "N/A"}. You can now ask me questions about this case.`
        }
      ])
    } catch (err: any) {
      setTxnError(err.message || "Failed to fetch transaction")
    } finally {
      setTxnLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg = input
    const historyForApi = [...messages]
    
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setInput("")
    setIsTyping(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
      const res = await fetch(`${baseUrl}/chat/investigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          chat_history: historyForApi,
          transaction_context: txnContext || {}
        }),
      })

      if (!res.ok) throw new Error("Failed to fetch response")
      
      const data = await res.json()
      
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.reply }
      ])
    } catch (error) {
      console.error(error)
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "System error: Unable to connect to the RAG backend." }
      ])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-6 lg:flex-row">
        {/* Chat Area */}
        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-secondary/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldQuestion className="h-5 w-5 text-primary" />
              Forensic Accounting AI
              {txnContext && (
                <span className="ml-2 text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {txnContext.transaction_id}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
                  }`}>
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <ShieldQuestion className="h-4 w-4" />}
                  </div>
                  <div
                    className={`rounded-xl px-4 py-3 max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 border border-border/50 text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground border border-border">
                    <ShieldQuestion className="h-4 w-4" />
                  </div>
                  <div className="rounded-xl px-4 py-4 bg-secondary/50 border border-border/50 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="border-t border-border p-4 bg-background">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about compliance regulations or account anomalies..."
                  className="flex-1 bg-secondary/30"
                />
                <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Context Sidebar */}
        <Card className="w-full lg:w-80">
          <CardHeader>
            <CardTitle className="text-base">Active Case Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLinkTransaction} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
                placeholder="Enter Transaction ID..."
                className="pl-9 h-9 pr-16"
              />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                disabled={txnLoading || !txnSearch.trim()}
                className="absolute right-1 top-0.5 h-8 px-2 text-xs"
              >
                {txnLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Link"}
              </Button>
            </form>

            {txnError && (
              <div className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {txnError}
              </div>
            )}
            
            {txnContext ? (
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-3">
                <div className="text-sm font-medium border-b border-border/50 pb-2 font-mono">{txnContext.transaction_id}</div>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium text-right">{txnContext.customer_id}</span>
                  
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium text-right">${txnContext.amount.toLocaleString()}</span>
                  
                  <span className="text-muted-foreground">Merchant:</span>
                  <span className="font-medium text-right">{txnContext.merchant}</span>
                  
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium text-right">{txnContext.location}</span>
                  
                  <span className="text-muted-foreground">Risk:</span>
                  <span className={`font-medium text-right ${
                    txnContext.risk_level === 'CRITICAL' || txnContext.risk_level === 'HIGH' ? 'text-red-400' :
                    txnContext.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {txnContext.risk_score ? `${(txnContext.risk_score * 100).toFixed(1)}%` : "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/50 bg-secondary/10 p-4 text-center text-xs text-muted-foreground">
                No transaction linked. Enter an ID above to start investigation.
              </div>
            )}
            
            <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-2">
              <div className="text-sm font-medium">Compliance Nodes</div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold">REG-001</span>
                <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold">REG-002</span>
                <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold">REG-003</span>
                <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold">REG-004</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
