import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getRiskColor(level: string): string {
  switch (level) {
    case "CRITICAL":
      return "text-red-400";
    case "HIGH":
      return "text-orange-400";
    case "MEDIUM":
      return "text-amber-400";
    case "LOW":
      return "text-emerald-400";
    default:
      return "text-zinc-400";
  }
}

export function getRiskBgColor(level: string): string {
  switch (level) {
    case "CRITICAL":
      return "bg-red-500/10 border-red-500/20 text-red-400";
    case "HIGH":
      return "bg-orange-500/10 border-orange-500/20 text-orange-400";
    case "MEDIUM":
      return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    case "LOW":
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    default:
      return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    case "DECLINED":
      return "bg-red-500/10 border-red-500/20 text-red-400";
    case "UNDER_REVIEW":
      return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    case "BLOCKED":
      return "bg-red-500/10 border-red-500/30 text-red-300";
    default:
      return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
  }
}
