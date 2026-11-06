"use client"

import * as React from "react"
import {
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Compass,
  ArrowRight,
  X,
  Sparkles,
  Check,
} from "lucide-react"
import { CurrencyCode, formatCurrency } from "@/lib/budget/budget-calculator"

export interface TripSetupData {
  destination: string
  tripTitle: string
  startDate: string
  endDate: string
  daysCount: number
  travelers: number
  targetBudget: number
  currency: CurrencyCode
}

interface TripSetupModalProps {
  isOpen: boolean
  onClose: () => void
  currentDestination?: string
  currentStartDate?: string
  currentEndDate?: string
  currentCurrency?: CurrencyCode
  currentTravelers?: number
  currentBudget?: number
  onApplySetup: (setup: TripSetupData) => void
}

export const POPULAR_DESTINATIONS = [
  { name: "Kyoto, Japan", label: "Kyoto", icon: "⛩️", title: "Kyoto Zen & Heritage Expedition" },
  { name: "Paris, France", label: "Paris", icon: "🗼", title: "Parisian Art & Gastronomy Journey" },
  { name: "Swiss Alps, Switzerland", label: "Swiss Alps", icon: "🏔️", title: "Swiss Alps Mountain Sanctuary" },
  { name: "Tokyo, Japan", label: "Tokyo", icon: "🌸", title: "Tokyo Futuristic & Culinary Discovery" },
  { name: "Santorini, Greece", label: "Santorini", icon: "🏛️", title: "Santorini Caldera & Sunset Retreat" },
  { name: "Bali, Indonesia", label: "Bali", icon: "🌴", title: "Bali Tropical Wellness Escape" },
  { name: "Amalfi Coast, Italy", label: "Amalfi Coast", icon: "🍋", title: "Amalfi Coastline & Cliffside Living" },
  { name: "New York City, USA", label: "New York", icon: "🗽", title: "New York City Culture & Skyline Tour" },
]

export const DAILY_BUDGET_TIERS: Record<CurrencyCode, { budget: number; balanced: number; luxury: number }> = {
  USD: { budget: 90, balanced: 250, luxury: 650 },
  EUR: { budget: 85, balanced: 230, luxury: 600 },
  GBP: { budget: 70, balanced: 200, luxury: 520 },
  JPY: { budget: 14000, balanced: 38000, luxury: 98000 },
  INR: { budget: 7500, balanced: 21000, luxury: 55000 },
  AUD: { budget: 140, balanced: 380, luxury: 990 },
  CAD: { budget: 125, balanced: 350, luxury: 900 },
  CHF: { budget: 80, balanced: 225, luxury: 585 },
}

// Date helpers
function getUpcomingDateString(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split("T")[0]
}

function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1
  try {
    const [y1, m1, d1] = startDateStr.split("-").map(Number)
    const [y2, m2, d2] = endDateStr.split("-").map(Number)
    const dt1 = Date.UTC(y1, m1 - 1, d1)
    const dt2 = Date.UTC(y2, m2 - 1, d2)
    const diffDays = Math.round((dt2 - dt1) / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, Math.min(30, diffDays))
  } catch {
    return 1
  }
}

function addDaysToDate(startDateStr: string, daysToAdd: number): string {
  if (!startDateStr) return getUpcomingDateString(daysToAdd)
  try {
    const [y, m, d] = startDateStr.split("-").map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + daysToAdd)
    return dt.toISOString().split("T")[0]
  } catch {
    return getUpcomingDateString(daysToAdd)
  }
}

function formatReadableDate(dateStr: string): string {
  if (!dateStr) return ""
  try {
    const [y, m, d] = dateStr.split("-").map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
  } catch {
    return dateStr
  }
}

export function TripSetupModal({
  isOpen,
  onClose,
  currentDestination = "",
  currentStartDate,
  currentEndDate,
  currentCurrency = "USD",
  currentTravelers = 2,
  currentBudget,
  onApplySetup,
}: TripSetupModalProps) {
  const defaultStart = currentStartDate || getUpcomingDateString(14)
  const defaultEnd = currentEndDate || addDaysToDate(defaultStart, 4)

  const [destination, setDestination] = React.useState(currentDestination)
  const [tripTitle, setTripTitle] = React.useState("")
  const [startDate, setStartDate] = React.useState(defaultStart)
  const [endDate, setEndDate] = React.useState(defaultEnd)
  const [travelers, setTravelers] = React.useState(currentTravelers)
  const [travelStyle, setTravelStyle] = React.useState<"budget" | "balanced" | "luxury" | "custom">("balanced")
  const [customBudgetVal, setCustomBudgetVal] = React.useState(currentBudget ? String(currentBudget) : "")
  const [currency] = React.useState<CurrencyCode>(currentCurrency)

  // Re-sync when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (currentDestination) setDestination(currentDestination)
      if (currentStartDate) setStartDate(currentStartDate)
      if (currentEndDate) setEndDate(currentEndDate)
      if (currentTravelers) setTravelers(currentTravelers)
      if (currentBudget) setCustomBudgetVal(String(currentBudget))
    }
  }, [isOpen, currentDestination, currentStartDate, currentEndDate, currentTravelers, currentBudget])

  // Computed days count from dates
  const daysCount = React.useMemo(() => {
    return calculateDaysBetween(startDate, endDate)
  }, [startDate, endDate])

  // Daily budget rate based on active currency and style tier
  const tierConfig = DAILY_BUDGET_TIERS[currency] || DAILY_BUDGET_TIERS.USD
  const dailyRate =
    travelStyle === "budget"
      ? tierConfig.budget
      : travelStyle === "luxury"
      ? tierConfig.luxury
      : tierConfig.balanced

  // Total calculated budget
  const calculatedBudget = React.useMemo(() => {
    if (travelStyle === "custom" && customBudgetVal) {
      const num = Number(customBudgetVal.replace(/[^0-9.]/g, ""))
      return isNaN(num) || num <= 0 ? dailyRate * daysCount * travelers : num
    }
    return dailyRate * daysCount * travelers
  }, [travelStyle, customBudgetVal, dailyRate, daysCount, travelers])

  // Handle changing start date
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart)
    // If newStart is after endDate, automatically adjust endDate
    if (newStart > endDate) {
      setEndDate(addDaysToDate(newStart, Math.max(1, daysCount - 1)))
    }
  }

  // Handle changing end date
  const handleEndDateChange = (newEnd: string) => {
    if (newEnd < startDate) {
      // If user picked an end date before start date, pull start date back
      setStartDate(newEnd)
      setEndDate(addDaysToDate(newEnd, 2))
    } else {
      setEndDate(newEnd)
    }
  }

  // Stepper for days count (adjusts endDate automatically)
  const handleAdjustDays = (delta: number) => {
    const nextDays = Math.max(1, Math.min(30, daysCount + delta))
    const nextEnd = addDaysToDate(startDate, nextDays - 1)
    setEndDate(nextEnd)
  }

  // Handle selecting a popular destination chip
  const handleSelectPopular = (pop: typeof POPULAR_DESTINATIONS[0]) => {
    setDestination(pop.name)
    setTripTitle(pop.title)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetDest = destination.trim() || "Sanctuary Gateway"
    const finalTitle = tripTitle.trim() || `Journey to ${targetDest}`

    onApplySetup({
      destination: targetDest,
      tripTitle: finalTitle,
      startDate,
      endDate,
      daysCount,
      travelers,
      targetBudget: Math.round(calculatedBudget),
      currency,
    })

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#050a10]/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl glass-shell border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto scrollbar-none bg-[#050a10]/95">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 glass-pill px-3 py-0.5 rounded-full text-[10px] uppercase tracking-wider text-[#e8d5b5]">
              <Compass className="w-3 h-3 text-[#38bdf8]" />
              <span>Expedition Setup</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Design Your Journey
            </h2>
            <p className="text-xs text-slate-300">
              Enter your destination and dates. ROVEO will automatically calculate your total days, timeline, and recommended budget.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── 1. DESTINATION / LOCATION ───────────────────────────────────── */}
          <div className="space-y-2.5">
            <label className="text-[11px] uppercase tracking-wider text-[#e8d5b5] font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>1. Where are you traveling? *</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value)
                  if (!tripTitle || tripTitle.startsWith("Journey to")) {
                    setTripTitle(`Journey to ${e.target.value}`)
                  }
                }}
                placeholder="e.g. Tokyo, Japan / Paris / Swiss Alps / Kyoto..."
                className="w-full glass-input rounded-2xl h-11 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:border-[#38bdf8]"
                required
                autoFocus
              />
            </div>

            {/* Popular 1-Click Destinations */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-slate-400">Popular Sanctuaries:</span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_DESTINATIONS.map((pop) => (
                  <button
                    key={pop.name}
                    type="button"
                    onClick={() => handleSelectPopular(pop)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                      destination === pop.name
                        ? "bg-[#38bdf8]/20 border-[#38bdf8] text-white shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                        : "glass-pill text-slate-300 hover:text-white hover:border-white/30"
                    }`}
                  >
                    <span>{pop.icon}</span>
                    <span>{pop.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── 2. DATES & AUTOMATIC DURATION CALCULATION ─────────────────── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider text-[#e8d5b5] font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>2. Select Your Travel Dates *</span>
              </label>

              {/* Days Stepper Quick Controls */}
              <div className="flex items-center gap-1.5 glass-pill px-2 py-0.5 rounded-full text-xs">
                <span className="text-[10px] text-slate-400">Duration:</span>
                <button
                  type="button"
                  onClick={() => handleAdjustDays(-1)}
                  disabled={daysCount <= 1}
                  className="w-4 h-4 rounded text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer flex items-center justify-center font-bold"
                >
                  -
                </button>
                <span className="font-mono text-[#38bdf8] font-bold text-xs">{daysCount}d</span>
                <button
                  type="button"
                  onClick={() => handleAdjustDays(1)}
                  disabled={daysCount >= 30}
                  className="w-4 h-4 rounded text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full glass-input rounded-xl h-10 px-3 text-xs text-white font-mono cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full glass-input rounded-xl h-10 px-3 text-xs text-white font-mono cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Calculated Days & Nights Telemetry Pill */}
            <div className="p-3 rounded-2xl glass-card border border-[#38bdf8]/30 flex items-center justify-between text-xs animate-reveal bg-[#38bdf8]/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#38bdf8]" />
                <span className="text-white font-medium">
                  Calculated Duration:
                </span>
                <span className="font-mono font-bold text-[#38bdf8]">
                  {daysCount} Days, {Math.max(0, daysCount - 1)} Nights
                </span>
              </div>
              <span className="text-slate-300 font-mono text-[11px] hidden sm:inline">
                {formatReadableDate(startDate)} — {formatReadableDate(endDate)}
              </span>
            </div>
          </div>

          {/* ─── 3. TRAVELERS & BUDGET ARCHITECTURE ──────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider text-[#e8d5b5] font-semibold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Budget Architecture & Travelers</span>
              </label>
            </div>

            {/* Travelers Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1">
                <Users className="w-3 h-3 text-[#38bdf8]" />
                <span>Party Size</span>
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { label: "1 Solo", val: 1 },
                  { label: "2 Couple", val: 2 },
                  { label: "4 Family", val: 4 },
                  { label: "6 Group", val: 6 },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setTravelers(t.val)}
                    className={`py-2 rounded-xl text-center font-medium transition-all cursor-pointer border ${
                      travelers === t.val
                        ? "bg-[#38bdf8]/20 border-[#38bdf8] text-white shadow-sm"
                        : "glass-pill text-slate-300 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Style / Daily Tier */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Travel Tier & Daily Cadence ({currency})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  {
                    id: "budget" as const,
                    name: "Explorer",
                    icon: "🎒",
                    rate: tierConfig.budget,
                    desc: "Smart budget & hostels",
                  },
                  {
                    id: "balanced" as const,
                    name: "Balanced",
                    icon: "⚖️",
                    rate: tierConfig.balanced,
                    desc: "Boutique stays & fine dining",
                    recommended: true,
                  },
                  {
                    id: "luxury" as const,
                    name: "Luxury",
                    icon: "💎",
                    rate: tierConfig.luxury,
                    desc: "5-star retreats & private guides",
                  },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setTravelStyle(tier.id)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer space-y-1 relative ${
                      travelStyle === tier.id
                        ? "bg-[#e8d5b5]/15 border-[#e8d5b5] text-white shadow-[0_0_15px_rgba(232,213,181,0.25)]"
                        : "glass-pill text-slate-300 hover:text-white"
                    }`}
                  >
                    {tier.recommended && (
                      <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wider bg-[#e8d5b5] text-[#050a10] px-1.5 py-0.2 rounded-full font-bold">
                        Recommended
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <span>{tier.icon}</span>
                      <span>{tier.name}</span>
                    </div>
                    <div className="font-mono text-[#38bdf8] text-xs font-bold">
                      {formatCurrency(tier.rate, currency)} <span className="text-[10px] text-slate-400 font-normal">/ day</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Formula & Target Budget Summary */}
            <div className="p-3.5 rounded-2xl glass-card border border-white/15 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Target Budget Formula:</span>
                <span className="font-mono font-bold text-white text-sm text-[#e8d5b5]">
                  {formatCurrency(calculatedBudget, currency)}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                {formatCurrency(dailyRate, currency)} / day × {daysCount} Days × {travelers} {travelers === 1 ? "Traveler" : "Travelers"}
              </p>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="glass-pill px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!destination.trim()}
              className="btn-luxe px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Start Planning Expedition</span>
              <ArrowRight className="w-4 h-4 text-[#050a10]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
