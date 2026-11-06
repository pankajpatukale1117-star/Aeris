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
  TrendingDown,
  Coins,
  ShieldCheck,
  Percent,
} from "lucide-react"
import {
  CurrencyCode,
  formatCurrency,
  CURRENCY_SYMBOLS,
  FX_RATES_FROM_USD,
  resolveDestinationEconomicProfile,
  calculateEqualSplit,
} from "@/lib/budget/budget-calculator"

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
  { name: "Goa, India", label: "Goa", icon: "🏖️", title: "Goa Coastal & Heritage Sanctuary" },
  { name: "Paris, France", label: "Paris", icon: "🗼", title: "Parisian Art & Gastronomy Journey" },
  { name: "Swiss Alps, Switzerland", label: "Swiss Alps", icon: "🏔️", title: "Swiss Alps Mountain Sanctuary" },
  { name: "Tokyo, Japan", label: "Tokyo", icon: "🌸", title: "Tokyo Futuristic & Culinary Discovery" },
  { name: "Santorini, Greece", label: "Santorini", icon: "🏛️", title: "Santorini Caldera & Sunset Retreat" },
  { name: "Bali, Indonesia", label: "Bali", icon: "🌴", title: "Bali Tropical Wellness Escape" },
  { name: "Amalfi Coast, Italy", label: "Amalfi Coast", icon: "🍋", title: "Amalfi Coastline & Cliffside Living" },
  { name: "Jaipur, India", label: "Jaipur", icon: "🏰", title: "Royal Jaipur Palaces & Fortresses" },
  { name: "New York City, USA", label: "New York", icon: "🗽", title: "New York City Culture & Skyline Tour" },
]

export const ALL_CURRENCIES: CurrencyCode[] = ["USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF"]

export const DAILY_BUDGET_TIERS: Record<CurrencyCode, { budget: number; balanced: number; luxury: number }> = {
  USD: { budget: 45, balanced: 110, luxury: 280 },
  INR: { budget: 1400, balanced: 3200, luxury: 8500 },
  EUR: { budget: 42, balanced: 100, luxury: 250 },
  GBP: { budget: 36, balanced: 85, luxury: 220 },
  JPY: { budget: 7000, balanced: 17000, luxury: 42000 },
  AUD: { budget: 70, balanced: 170, luxury: 430 },
  CAD: { budget: 62, balanced: 155, luxury: 390 },
  CHF: { budget: 40, balanced: 98, luxury: 250 },
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
  const [travelers, setTravelers] = React.useState(Math.max(1, currentTravelers || 2))
  const [travelStyle, setTravelStyle] = React.useState<"budget" | "balanced" | "luxury" | "custom">("balanced")
  const [currency, setCurrency] = React.useState<CurrencyCode>(currentCurrency)
  const [totalBudgetInput, setTotalBudgetInput] = React.useState<string>(
    currentBudget ? String(currentBudget) : ""
  )

  // Computed days count from dates
  const daysCount = React.useMemo(() => {
    return calculateDaysBetween(startDate, endDate)
  }, [startDate, endDate])

  // Real-Time Destination Purchasing Power Parity & Economic Profile
  const economicProfile = React.useMemo(() => {
    return resolveDestinationEconomicProfile(destination, currency)
  }, [destination, currency])

  // Active Daily Rate based on Tier
  const dailyRate = React.useMemo(() => {
    if (travelStyle === "budget") return economicProfile.dailyRates.budget
    if (travelStyle === "luxury") return economicProfile.dailyRates.luxury
    return economicProfile.dailyRates.balanced
  }, [travelStyle, economicProfile])

  // Re-sync when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (currentDestination) setDestination(currentDestination)
      if (currentStartDate) setStartDate(currentStartDate)
      if (currentEndDate) setEndDate(currentEndDate)
      if (currentTravelers) setTravelers(Math.max(1, currentTravelers))
      if (currentCurrency) setCurrency(currentCurrency)
      if (currentBudget) {
        setTotalBudgetInput(String(currentBudget))
        setTravelStyle("custom")
      } else {
        const initProfile = resolveDestinationEconomicProfile(currentDestination, currentCurrency || "USD")
        const initTotal = initProfile.dailyRates.balanced * daysCount * (currentTravelers || 2)
        setTotalBudgetInput(String(initTotal))
      }
    }
  }, [isOpen, currentDestination, currentStartDate, currentEndDate, currentTravelers, currentCurrency, currentBudget, daysCount])

  // When currency or destination changes and user is on an analyzed tier, auto-recalibrate total budget
  React.useEffect(() => {
    if (travelStyle !== "custom") {
      const computedTotal = dailyRate * daysCount * travelers
      setTotalBudgetInput(String(computedTotal))
    }
  }, [currency, destination, travelStyle, dailyRate, daysCount, travelers])

  // Final numeric total budget calculation
  const calculatedBudget = React.useMemo(() => {
    if (travelStyle === "custom" && totalBudgetInput) {
      const num = Number(totalBudgetInput.replace(/[^0-9.]/g, ""))
      if (!isNaN(num) && num > 0) return num
    }
    return dailyRate * daysCount * travelers
  }, [travelStyle, totalBudgetInput, dailyRate, daysCount, travelers])

  // Equal Split Calculations (Total divided equally among members)
  const equalSplit = React.useMemo(() => {
    return calculateEqualSplit(calculatedBudget, travelers, daysCount, currency)
  }, [calculatedBudget, travelers, daysCount, currency])

  // Handle changing start date
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart)
    if (newStart > endDate) {
      setEndDate(addDaysToDate(newStart, Math.max(1, daysCount - 1)))
    }
  }

  // Handle changing end date
  const handleEndDateChange = (newEnd: string) => {
    if (newEnd < startDate) {
      setStartDate(newEnd)
      setEndDate(addDaysToDate(newEnd, 2))
    } else {
      setEndDate(newEnd)
    }
  }

  // Stepper for days count
  const handleAdjustDays = (delta: number) => {
    const nextDays = Math.max(1, Math.min(30, daysCount + delta))
    const nextEnd = addDaysToDate(startDate, nextDays - 1)
    setEndDate(nextEnd)
  }

  // Handle custom traveler count adjustments
  const handleAdjustTravelers = (delta: number) => {
    const nextTravelers = Math.max(1, Math.min(50, travelers + delta))
    setTravelers(nextTravelers)
    if (travelStyle !== "custom") {
      setTotalBudgetInput(String(dailyRate * daysCount * nextTravelers))
    }
  }

  // When user directly inputs Total Budget
  const handleTotalBudgetChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, "")
    setTotalBudgetInput(clean)
    setTravelStyle("custom")
  }

  // When user selects an analyzed tier
  const handleSelectTier = (tier: "budget" | "balanced" | "luxury") => {
    setTravelStyle(tier)
    const rate = economicProfile.dailyRates[tier]
    const newTotal = rate * daysCount * travelers
    setTotalBudgetInput(String(newTotal))
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
      <div className="relative w-full max-w-2xl glass-shell border border-white/20 rounded-3xl shadow-2xl p-5 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto scrollbar-none bg-[#050a10]/95">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 glass-pill px-3 py-0.5 rounded-full text-[10px] uppercase tracking-wider text-[#e8d5b5]">
              <Compass className="w-3 h-3 text-[#38bdf8]" />
              <span>Expedition Genesis Architecture</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Design Your Journey
            </h2>
            <p className="text-xs text-slate-300">
              Enter location and dates. ROVEO calculates duration, members share, and real-time analyzed market rates.
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

        {/* Currency Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-[#38bdf8]" />
            Active Currency:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {ALL_CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  currency === c
                    ? "bg-[#38bdf8]/20 text-white font-bold border border-[#38bdf8]/50 shadow-sm"
                    : "glass-pill text-slate-400 hover:text-white"
                }`}
              >
                {CURRENCY_SYMBOLS[c]} {c}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── 1. DESTINATION / LOCATION ───────────────────────────────────── */}
          <div className="space-y-2.5">
            <label className="text-[11px] uppercase tracking-wider text-[#e8d5b5] font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>1. Destination & Regional Purchasing Power *</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value)
                  if (!tripTitle || tripTitle.startsWith("Journey to") || tripTitle.startsWith("Expedition to")) {
                    setTripTitle(`Expedition to ${e.target.value.split(",")[0] || e.target.value}`)
                  }
                }}
                placeholder="e.g. Goa, India / Kyoto, Japan / Paris / Bali..."
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
                      destination.toLowerCase().includes(pop.label.toLowerCase())
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

            {/* Real-Time Analyzed Economic Telemetry Banner */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Real-Time Analyzed: {economicProfile.regionLabel}
                </span>
                <span className="text-[9px] text-[#e8d5b5] font-mono glass-pill px-2 py-0.5 rounded-full">
                  {economicProfile.purchasingPowerLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {economicProfile.description}
              </p>
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

          {/* ─── 3. TRAVELERS / MEMBERS (FULLY CUSTOMIZABLE) ──────────────────── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider text-[#e8d5b5] font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Party Members (Customizable) *</span>
              </label>
              <span className="text-[10px] text-slate-400">Total: {travelers} {travelers === 1 ? "Member" : "Members"}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Stepper + Direct Input */}
              <div className="flex items-center gap-2 glass-pill px-3 py-2 rounded-2xl border border-white/10 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => handleAdjustTravelers(-1)}
                  disabled={travelers <= 1}
                  className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-all"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={travelers}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(99, parseInt(e.target.value) || 1))
                      setTravelers(val)
                      if (travelStyle !== "custom") {
                        setTotalBudgetInput(String(dailyRate * daysCount * val))
                      }
                    }}
                    className="w-16 text-center font-mono text-base font-bold text-white bg-transparent outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block -mt-0.5">
                    {travelers === 1 ? "Traveler" : "Travelers"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjustTravelers(1)}
                  disabled={travelers >= 50}
                  className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-all"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: "1 Solo", val: 1 },
                  { label: "2 Couple", val: 2 },
                  { label: "3 Friends", val: 3 },
                  { label: "4 Family", val: 4 },
                  { label: "6 Group", val: 6 },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => {
                      setTravelers(t.val)
                      if (travelStyle !== "custom") {
                        setTotalBudgetInput(String(dailyRate * daysCount * t.val))
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
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
          </div>

          {/* ─── 4. TOTAL BUDGET & EQUAL COST DIVISION ───────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider text-[#e8d5b5] font-semibold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>4. Total Trip Budget & Analyzed Rates</span>
              </label>
              <span className="text-[10px] text-slate-400">Currency: {currency}</span>
            </div>

            {/* Direct Total Trip Budget Input */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Enter Your Total Trip Budget ({CURRENCY_SYMBOLS[currency]}):</span>
                <span className="text-[10px] text-emerald-400 font-mono">Custom or Analyzed</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-mono text-sm text-slate-400">
                  {CURRENCY_SYMBOLS[currency]}
                </span>
                <input
                  type="number"
                  value={totalBudgetInput}
                  onChange={(e) => handleTotalBudgetChange(e.target.value)}
                  placeholder="e.g. 50000 or 1500"
                  className="w-full glass-input rounded-xl h-10 pl-9 pr-4 text-sm font-mono text-white font-bold placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* 1-Click Analyzed Travel Style Tiers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                  Or Pick a Real-Time Analyzed Tier ({currency}):
                </span>
                <span className="text-[10px] text-[#38bdf8] font-mono">Per Member / Day</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  {
                    id: "budget" as const,
                    name: "Explorer",
                    icon: "🎒",
                    rate: economicProfile.dailyRates.budget,
                    desc: "Hostels, street food & trains",
                  },
                  {
                    id: "balanced" as const,
                    name: "Balanced",
                    icon: "⚖️",
                    rate: economicProfile.dailyRates.balanced,
                    desc: "3-4★ boutique & good dining",
                    recommended: true,
                  },
                  {
                    id: "luxury" as const,
                    name: "Luxury",
                    icon: "💎",
                    rate: economicProfile.dailyRates.luxury,
                    desc: "5★ heritage, fine dining & private cars",
                  },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => handleSelectTier(tier.id)}
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

            {/* EQUALLY DIVIDED COST PER MEMBER CARD */}
            <div className="p-4 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-500/5 space-y-2.5 text-xs animate-reveal">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Equally Divided Among {travelers} {travelers === 1 ? "Member" : "Members"}:
                </span>
                <span className="font-mono font-bold text-base text-emerald-300">
                  {formatCurrency(equalSplit.perPersonTotal, currency)} <span className="text-xs font-normal text-slate-400">/ member</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Daily per Member:</span>
                  <span className="font-mono text-[#38bdf8] font-bold">
                    {formatCurrency(equalSplit.dailyPerPerson, currency)} / day
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Group Trip Cost:</span>
                  <span className="font-mono text-white font-bold">
                    {formatCurrency(equalSplit.totalBudget, currency)} ({daysCount}d)
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-mono pt-1">
                Formula: {formatCurrency(equalSplit.totalBudget, currency)} total ÷ {travelers} {travelers === 1 ? "person" : "people"} = {formatCurrency(equalSplit.perPersonTotal, currency)} each across {daysCount} Days.
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
