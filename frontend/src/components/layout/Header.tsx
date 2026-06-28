"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, User, X, ShieldAlert, Loader2 } from "lucide-react"
import { formatCurrency, getRiskBgColor, timeAgo } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!showNotifications) return

    setLoadingNotifications(true)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
    fetch(`${baseUrl}/alerts?page_size=5`)
      .then(res => res.json())
      .then(data => setNotifications(data.alerts || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoadingNotifications(false))
  }, [showNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search handler — navigates to dashboard with query param for client-side filtering
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      {/* Search Bar */}
      <div className="flex flex-1 items-center gap-4">
        <form onSubmit={handleSearch} className="relative w-full max-w-md hidden md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 bg-secondary/50 py-1.5 pl-10 pr-3 text-sm text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all"
            placeholder="Search transaction ID, customer, merchant..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <Bell className="h-5 w-5" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-secondary/20">
                <span className="text-sm font-semibold">Recent Alerts</span>
                <button
                  onClick={() => {
                    setShowNotifications(false)
                    router.push("/alerts")
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No recent alerts.
                  </div>
                ) : (
                  notifications.map((alert: any) => (
                    <div
                      key={alert.transaction_id}
                      className="flex items-start gap-3 border-b border-border/30 px-4 py-3 hover:bg-secondary/20 transition-colors cursor-pointer"
                      onClick={() => {
                        setShowNotifications(false)
                        router.push("/alerts")
                      }}
                    >
                      <div className="mt-0.5">
                        <ShieldAlert className={`h-4 w-4 ${
                          alert.risk_level === 'CRITICAL' ? 'text-red-400' :
                          alert.risk_level === 'HIGH' ? 'text-orange-400' : 'text-amber-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium truncate">{alert.transaction_id}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getRiskBgColor(alert.risk_level)}`}>
                            {alert.risk_level}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(alert.amount)} • {alert.merchant}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {timeAgo(new Date(alert.timestamp))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-border" />
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-medium">Risk Analyst</span>
            <span className="text-xs text-emerald-400">System Online</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-primary">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  )
}
