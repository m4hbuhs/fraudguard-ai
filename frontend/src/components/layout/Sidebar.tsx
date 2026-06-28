"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldAlert, LayoutDashboard, Search, Settings, ShieldQuestion, BrainCircuit } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AddTransactionModal } from "@/components/dashboard/AddTransactionModal"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Alerts", href: "/alerts", icon: ShieldAlert },
  { name: "Model Insights", href: "/insights", icon: BrainCircuit },
  { name: "Investigator", href: "/investigate", icon: ShieldQuestion },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2 px-6 border-b border-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight">FraudGuard AI</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 relative transition-all duration-300",
                    isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r bg-primary" />
                  )}
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-border/50 p-4 space-y-2">
        <AddTransactionModal />
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </aside>
  )
}
