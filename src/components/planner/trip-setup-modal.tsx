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
  TrendingDown,
  Coins,
  ShieldCheck,
  Check,
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
  openDiscoveryOnStart?: boolean
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

const QUICK_DAY_CHIPS = [
  { label: "3 Days", desc: "Weekend", days: 3 },
  { label: "4 Days", desc: "Short Break", days: 4 },
  { label: "5 Days", desc: "Getaway", days: 5 },
  { label: "7 Days", desc: "1 Week", days: 7 },
  { label: "10 Days", desc: "Extended", days: 10 },
  { label: "14 Days", desc: "2 Weeks", days: 14 },
]

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
    const year = dt.getUTCFullYear()
    const month = String(dt.getUTCMonth() + 1).padStart(2, "0")
    const day = String(dt.getUTCDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  } catch {
    return startDateStr
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
  currentStartDate = "",
  currentEndDate = "",
  currentCurrency = "USD",
  currentTravelers = 2,
  currentBudget = 0,
  onApplySetup,
}: TripSetupModalProps) {
  // Destination & Title
  const [destination, setDestination] = React.useState(currentDestination)
  const [tripTitle, setTripTitle] = React.useState("")

  // Currency
  const [currency, setCurrency] = React.useState<CurrencyCode>(currentCurrency)

  // Dates
  const [startDate, setStartDate] = React.useState(currentStartDate || getUpcomingDateString(14))
  const [endDate, setEndDate] = React.useState(
    currentEndDate || addDaysToDate(currentStartDate || getUpcomingDateString(14), 3)
  )

  // Party Members (Customizable)
  const [travelers, setTravelers] = React.useState(currentTravelers || 2)

  // Travel Style & Total Budget
  const [travelStyle, setTravelStyle] = React.useState<"budget" | "balanced" | "luxury" | "custom">("balanced")
  const [totalBudgetInput, setTotalBudgetInput] = React.useState<string>(
    currentBudget > 0 ? String(currentBudget) : ""
  )

  // Synchronize initial state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (currentDestination) setDestination(currentDestination)
      if (currentStartDate) setStartDate(currentStartDate)
      if (currentEndDate) setEndDate(currentEndDate)
      if (currentCurrency) setCurrency(currentCurrency)
      if (currentTravelers) setTravelers(currentTravelers)
      if (currentBudget > 0) {
        setTotalBudgetInput(String(currentBudget))
        setTravelStyle("custom")
      }
    }
  }, [isOpen, currentDestination, currentStartDate, currentEndDate, currentCurrency, currentTravelers, currentBudget])

  // Calculated duration
  const daysCount = React.useMemo(() => {
    return calculateDaysBetween(startDate, endDate)
  }, [startDate, endDate])

  // Real-time Regional Purchasing Power & Economic Profile
  const economicProfile = React.useMemo(() => {
    return resolveDestinationEconomicProfile(destination, currency)
  }, [destination, currency])

  // Active Daily Rate per Person based on travel style
  const dailyRate = React.useMemo(() => {
    if (travelStyle === "budget") return economicProfile.dailyRates.budget
    if (travelStyle === "balanced") return economicProfile.dailyRates.balanced
    if (travelStyle === "luxury") return economicProfile.dailyRates.luxury
    return economicProfile.dailyRates.balanced
  }, [travelStyle, economicProfile])

  // Keep total budget input synced with tier if user is using a preset tier
  React.useEffect(() => {
    if (travelStyle !== "custom") {
      const computedTotal = dailyRate * daysCount * travelers
      setTotalBudgetInput(String(computedTotal))
    }
  }, [travelStyle, dailyRate, daysCount, travelers])

  // Numeric budget calculation
  const calculatedBudget = React.useMemo(() => {
    const raw = String(totalBudgetInput).replace(/[^0-9.]/g, "")
    const num = Number(raw)
    if (!isNaN(num) && num > 0) return num
    return dailyRate * daysCount * travelers
  }, [totalBudgetInput, dailyRate, daysCount, travelers])

  // Equal division breakdown among party members
  const equalSplit = React.useMemo(() => {
    return calculateEqualSplit(calculatedBudget, travelers, daysCount, currency)
  }, [calculatedBudget, travelers, daysCount, currency])

  // Handle changing start date: preserve duration
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart)
    setEndDate(addDaysToDate(newStart, Math.max(0, daysCount - 1)))
  }

  // Handle changing end date: calculate duration
  const handleEndDateChange = (newEnd: string) => {
    if (newEnd < startDate) {
      setStartDate(newEnd)
      setEndDate(addDaysToDate(newEnd, Math.max(0, daysCount - 1)))
    } else {
      setEndDate(newEnd)
      const calculated = calculateDaysBetween(startDate, newEnd)
      if (travelStyle !== "custom") {
        setTotalBudgetInput(String(dailyRate * calculated * travelers))
      }
    }
  }

  // Direct days count change (via input, stepper, or quick chips)
  const handleDaysCountChange = (newDays: number) => {
    const validDays = Math.max(1, Math.min(30, newDays || 1))
    const nextEnd = addDaysToDate(startDate, validDays - 1)
    setEndDate(nextEnd)
    if (travelStyle !== "custom") {
      setTotalBudgetInput(String(dailyRate * validDays * travelers))
    }
  }

  // Stepper for days count
  const handleAdjustDays = (delta: number) => {
    handleDaysCountChange(daysCount + delta)
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
  const handleSelectPopular = (pop: (typeof POPULAR_DESTINATIONS)[0]) => {
    setDestination(pop.name)
    setTripTitle(pop.title)
  }

  const handleProceed = (openDiscovery: boolean = true) => {
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
      openDiscoveryOnStart: openDiscovery,
    })

    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleProceed(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#050a10]/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl glass-shell border border-white/20 rounded-3xl shadow-2xl bg-[#050a10]/95 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ─── 1. FIXED MODAL HEADER ────────────────────────────────────────── */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 glass-pill px-3 py-0.5 rounded-full text-[10px] uppercase tracking-wider text-[#e8d5b5]">
              <Compass className="w-3 h-3 text-[#38bdf8]" />
              <span>Expedition Genesis Architecture</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Design Your Journey
            </h2>
            <p className="text-xs text-slate-300">
              Customize location, days, members, and budget. ROVEO calculates equal splits and real-time analyzed spots.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── 2. SCROLLABLE FORM BODY ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Active Currency Switcher Bar */}
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

          <form id="trip-setup-form" onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="e.g. Goa, India / Kyoto, Japan / Paris / Bali / Swiss Alps..."
                  className="w-full glass-input rounded-2xl h-11 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:border-[#38bdf8]"
                  required
                />
              </div>

              {/* Quick Destination Pills */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                  Popular Global Destinations:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {POPULAR_DESTINATIONS.map((pop) => (
                    <button
                      key={pop.name}
                      type="button"
                      onClick={() => handleSelectPopular(pop)}
                      className={`px-2.5 py-1 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border ${
                        destination.toLowerCase().includes(pop.label.toLowerCase())
                          ? "bg-[#e8d5b5]/20 border-[#e8d5b5] text-white font-medium shadow-sm"
                          : "glass-pill text-slate-300 hover:text-white"
                      }`}
                    >
                      <span>{pop.icon}</span>
                      <span>{pop.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination Economic Benchmark Info Card */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
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

            {/* ─── 2. DATES & CUSTOMIZABLE DAYS DURATION ─────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-[11px] uppercase tracking-wider text-[#e8d5b5] font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>2. Travel Dates & Days Count (Customizable) *</span>
                </label>

                {/* Duration Stepper & Direct Number Input */}
                <div className="flex items-center gap-1.5 glass-pill px-2.5 py-1 rounded-full text-xs border border-white/10 bg-white/5">
                  <span className="text-[10px] text-slate-400">Duration:</span>
                  <button
                    type="button"
                    onClick={() => handleAdjustDays(-1)}
                    disabled={daysCount <= 1}
                    className="w-5 h-5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white disabled:opacity-30 cursor-pointer flex items-center justify-center font-bold text-xs"
                    title="Decrease 1 day"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={daysCount}
                    onChange={(e) => handleDaysCountChange(parseInt(e.target.value) || 1)}
                    className="w-10 text-center font-mono font-bold text-[#38bdf8] text-xs bg-transparent outline-none"
                  />
                  <span className="text-[#38bdf8] font-mono font-bold text-xs -ml-1">Days</span>
                  <button
                    type="button"
                    onClick={() => handleAdjustDays(1)}
                    disabled={daysCount >= 30}
                    className="w-5 h-5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white disabled:opacity-30 cursor-pointer flex items-center justify-center font-bold text-xs"
                    title="Increase 1 day"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Day Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_DAY_CHIPS.map((chip) => (
                  <button
                    key={chip.days}
                    type="button"
                    onClick={() => handleDaysCountChange(chip.days)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                      daysCount === chip.days
                        ? "bg-[#38bdf8]/20 border-[#38bdf8] text-white font-bold shadow-sm"
                        : "glass-pill text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className="text-[9px] text-slate-400 ml-1">({chip.desc})</span>
                  </button>
                ))}
              </div>

              {/* Start & End Date Pickers */}
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
                    placeholder="e.g. 24800 or 1500"
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
          </form>
        </div>

        {/* ─── 3. STICKY MODAL FOOTER (ALWAYS VISIBLE PINNED TO BOTTOM) ─────── */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-white/15 bg-[#050a10]/98 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl z-20">
          {/* Live Summary Chips */}
          <div className="flex items-center gap-2 text-xs flex-wrap self-start sm:self-auto">
            <span className="font-mono text-[#e8d5b5] font-bold">
              {daysCount} Days • {travelers} {travelers === 1 ? "Member" : "Members"}
            </span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-emerald-300 font-bold">
              {formatCurrency(calculatedBudget, currency)}
            </span>
            <span className="text-slate-400 text-[11px] font-mono">
              ({formatCurrency(equalSplit.perPersonTotal, currency)}/person)
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="glass-pill px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleProceed(false)}
              disabled={!destination.trim()}
              className="px-3.5 py-2 rounded-xl border border-white/20 text-xs text-slate-200 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
              title="Initialize timeline without opening spot suggestions"
            >
              Clean Slate
            </button>

            <button
              type="button"
              onClick={() => handleProceed(true)}
              disabled={!destination.trim()}
              className="btn-luxe px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xl disabled:opacity-40"
              title="Architect trip and discover spots within your budget"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#050a10]" />
              <span>Architect & Discover Spots</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#050a10]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
