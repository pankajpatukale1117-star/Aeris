"use client"

import * as React from "react"
import {
  X,
  Sparkles,
  Compass,
  MapPin,
  Clock,
  DollarSign,
  Plus,
  Check,
  Bookmark,
  Loader2,
  RefreshCw,
  Sun,
  TreePine,
  Utensils,
  Building2,
  Ticket,
  Users,
  Calendar,
  AlertCircle,
  HelpCircle,
} from "lucide-react"
import { CurrencyCode, CURRENCY_SYMBOLS } from "@/lib/budget/budget-calculator"
import { ActivityItem } from "@/components/trip/activity-card"
import { StagedItem } from "@/components/planner/scratchpad-tray"

export type DiscoveryCategory =
  | "All"
  | "Sunset Points"
  | "Picnic Spots"
  | "Restaurants"
  | "Hotels"
  | "Entertainment"

export interface BudgetRecommendationItem {
  id: string
  title: string
  category: "Hotels" | "Restaurants" | "Entertainment" | "Picnic Spots" | "Sunset Points"
  estimatedCost: string // numeric string or "Free"
  costPerPerson: string
  location: string
  bestTime: string
  duration: string
  budgetFit: string
  description: string
  tags: string[]
}

export interface BudgetDiscoveryModalProps {
  isOpen: boolean
  onClose: () => void
  destination: string
  currency: CurrencyCode
  totalBudget: number
  daysCount: number
  travelers: number
  activeDayNumber: number
  allDayNumbers?: number[]
  onAddToDay: (activity: ActivityItem, targetDayNumber: number) => void
  onAddToBucketList: (staged: StagedItem) => void
}

const CATEGORY_TABS: Array<{ id: DiscoveryCategory; label: string; icon: React.ElementType }> = [
  { id: "All", label: "All Spots", icon: Compass },
  { id: "Sunset Points", label: "Sunset Points", icon: Sun },
  { id: "Picnic Spots", label: "Picnic Spots", icon: TreePine },
  { id: "Restaurants", label: "Restaurants & Dining", icon: Utensils },
  { id: "Hotels", label: "Hotels & Stays", icon: Building2 },
  { id: "Entertainment", label: "Entertainment", icon: Ticket },
]

/**
 * Bulletproof number formatter that NEVER throws on undefined/null/NaN
 */
function safeFormatNumber(val: any, fallback = "0"): string {
  if (val === undefined || val === null || val === "") return fallback
  if (typeof val === "number") {
    if (isNaN(val)) return fallback
    return Math.round(val).toLocaleString()
  }
  const clean = String(val).replace(/[^0-9.]/g, "")
  const num = Number(clean)
  if (isNaN(num) || clean === "") {
    return String(val)
  }
  return Math.round(num).toLocaleString()
}

/**
 * React Error Boundary to catch any render-time exception inside the modal
 */
class BudgetDiscoveryErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose: () => void },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode; onClose: () => void }) {
    super(props)
    this.state = { hasError: false, errorMessage: "" }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMessage: error?.message || "An unexpected error occurred." }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("BudgetDiscoveryModal Error Boundary caught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-shell w-full max-w-md p-6 rounded-3xl border border-rose-500/30 bg-[#0b1320]/95 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-editorial text-lg font-bold text-white">
                Budget Discovery Unavailable
              </h3>
              <p className="text-xs text-slate-300">
                A temporary telemetry error occurred while curating recommendations.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={this.props.onClose}
                className="btn-luxe px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function BudgetDiscoveryModalInner({
  isOpen,
  onClose,
  destination,
  currency,
  totalBudget,
  daysCount,
  travelers,
  activeDayNumber,
  onAddToDay,
  onAddToBucketList,
}: BudgetDiscoveryModalProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<DiscoveryCategory>("All")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [recommendations, setRecommendations] = React.useState<BudgetRecommendationItem[]>([])
  const [budgetAnalysis, setBudgetAnalysis] = React.useState<any>(null)
  const [addedMap, setAddedMap] = React.useState<Record<string, "day" | "bucket">>({})

  const currencySymbol = CURRENCY_SYMBOLS[currency] || "$"

  const safeTotalBudget = Number(totalBudget) > 0 ? Number(totalBudget) : 2000
  const safeDaysCount = Math.max(1, Number(daysCount) || 3)
  const safeTravelers = Math.max(1, Number(travelers) || 2)
  const perPersonBudget = Math.round(safeTotalBudget / safeTravelers)

  const fetchRecommendations = React.useCallback(async () => {
    const dest = destination?.trim() || "Amalfi Coast, Italy"

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/budget-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: dest,
          currency,
          totalBudget: safeTotalBudget,
          daysCount: safeDaysCount,
          travelers: safeTravelers,
          category: selectedCategory === "All" ? undefined : selectedCategory,
        }),
      })

      if (!res.ok) {
        throw new Error("Unable to analyze budget recommendations. Please try again.")
      }

      const data = await res.json()
      if (data?.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations)
        if (data.budgetAnalysis) {
          setBudgetAnalysis(data.budgetAnalysis)
        }
      } else {
        throw new Error("No recommendations returned for this destination.")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load budget discoveries.")
    } finally {
      setIsLoading(false)
    }
  }, [destination, currency, safeTotalBudget, safeDaysCount, safeTravelers, selectedCategory])

  // Trigger fetch whenever modal opens or category changes
  React.useEffect(() => {
    if (isOpen) {
      fetchRecommendations()
    }
  }, [isOpen, selectedCategory, fetchRecommendations])

  if (!isOpen) return null

  // Handle adding recommendation directly to current day
  const handleAddDirectlyToDay = (item: BudgetRecommendationItem) => {
    const bestTimeStr = typeof item?.bestTime === "string" ? item.bestTime : "14:00"
    const timeParts = bestTimeStr.split(/[—–-]/)
    const startTime = timeParts[0]?.trim() || "14:00"
    const endTime = timeParts[1]?.trim() || ""

    let generalCategory = "Sightseeing"
    if (item.category === "Hotels") generalCategory = "Stay"
    else if (item.category === "Restaurants") generalCategory = "Dining"
    else if (item.category === "Entertainment") generalCategory = "Culture & Nightlife"

    const isFree = item.estimatedCost === "Free" || item.estimatedCost === "0"
    const numericCost = isFree ? 0 : Number(String(item.estimatedCost).replace(/[^0-9.]/g, "")) || 0

    const newActivity: ActivityItem = {
      id: `disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: startTime,
      startTime: startTime,
      endTime: endTime || undefined,
      title: item.title || "Curated Discovery",
      description: `${item.description || ""} • ${item.budgetFit || ""}`,
      duration: item.duration || "1.5h",
      location: item.location || destination,
      estimatedCost: isFree ? "Free" : `${currencySymbol}${safeFormatNumber(item.estimatedCost)}`,
      cost: numericCost,
      category: generalCategory,
      bookingStatus: "wishlist",
    }

    onAddToDay(newActivity, activeDayNumber || 1)
    setAddedMap((prev) => ({ ...prev, [item.id]: "day" }))
  }

  // Handle saving recommendation to scratchpad / bucket list
  const handleAddToBucketList = (item: BudgetRecommendationItem) => {
    const isFree = item.estimatedCost === "Free" || item.estimatedCost === "0"
    const staged: StagedItem = {
      id: `stage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: item.title || "Curated Discovery",
      location: item.location || destination,
      estimatedCost: isFree ? "Free" : `${currencySymbol}${safeFormatNumber(item.estimatedCost)}`,
      category: item.category || "Sightseeing",
      notes: `${item.bestTime ? `Best Time: ${item.bestTime} • ` : ""}${item.description || ""} (${item.budgetFit || ""})`,
    }

    onAddToBucketList(staged)
    setAddedMap((prev) => ({ ...prev, [item.id]: "bucket" }))
  }

  // Category Icon helper
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Sunset Points":
        return <Sun className="w-4 h-4 text-amber-400" />
      case "Picnic Spots":
        return <TreePine className="w-4 h-4 text-emerald-400" />
      case "Restaurants":
        return <Utensils className="w-4 h-4 text-rose-400" />
      case "Hotels":
        return <Building2 className="w-4 h-4 text-sky-400" />
      case "Entertainment":
        return <Ticket className="w-4 h-4 text-purple-400" />
      default:
        return <Compass className="w-4 h-4 text-[#e8d5b5]" />
    }
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Sunset Points":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30"
      case "Picnic Spots":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
      case "Restaurants":
        return "bg-rose-500/10 text-rose-300 border-rose-500/30"
      case "Hotels":
        return "bg-sky-500/10 text-sky-300 border-sky-500/30"
      case "Entertainment":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30"
      default:
        return "bg-white/10 text-slate-300 border-white/20"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-shell w-full max-w-4xl max-h-[90vh] rounded-3xl border border-white/20 shadow-2xl flex flex-col bg-[#0b1320]/95 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 shrink-0 bg-white/[0.02]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="editorial-tag text-xs text-amber-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Real-Time Budget Discovery
              </span>
              <span className="glass-pill px-2.5 py-0.5 rounded-full text-[11px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Within Your Budget
              </span>
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>Smart Spot Recommendations in</span>
              <span className="text-[#e8d5b5] underline decoration-[#e8d5b5]/30">
                {destination || "Your Destination"}
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap pt-0.5">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Budget:{" "}
                <strong className="text-white">
                  {currencySymbol}
                  {safeFormatNumber(safeTotalBudget)} {currency}
                </strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                {safeTravelers} {safeTravelers === 1 ? "Traveler" : "Travelers"} (
                {currencySymbol}
                {safeFormatNumber(perPersonBudget)} each)
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                {safeDaysCount} Days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRecommendations}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh recommendations"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close discovery modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Budget Allowance Bar */}
        {budgetAnalysis?.targetAllocations && (
          <div className="px-5 py-3 bg-white/[0.03] border-b border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <div className="text-[10px] uppercase font-mono text-sky-300">Stays Nightly Target</div>
              <div className="font-semibold text-white text-sm">
                ~{currencySymbol}
                {safeFormatNumber(budgetAnalysis.targetAllocations.hotelPerNight, "120")}
                <span className="text-[10px] text-slate-400 font-normal"> / night</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="text-[10px] uppercase font-mono text-rose-300">Dining Daily / Person</div>
              <div className="font-semibold text-white text-sm">
                ~{currencySymbol}
                {safeFormatNumber(budgetAnalysis.targetAllocations.diningPerPersonDaily, "40")}
                <span className="text-[10px] text-slate-400 font-normal"> / person</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="text-[10px] uppercase font-mono text-purple-300">Activities / Person</div>
              <div className="font-semibold text-white text-sm">
                ~{currencySymbol}
                {safeFormatNumber(budgetAnalysis.targetAllocations.entertainmentPerPersonDaily, "30")}
                <span className="text-[10px] text-slate-400 font-normal"> / person</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-[10px] uppercase font-mono text-amber-300">Sunset & Free Reserves</div>
              <div className="font-semibold text-white text-sm">
                ~{currencySymbol}
                {safeFormatNumber(
                  budgetAnalysis.targetAllocations.scenicAndBufferDaily ||
                    budgetAnalysis.targetAllocations.scenicAndSunsetBuffer ||
                    25,
                  "25"
                )}
                <span className="text-[10px] text-slate-400 font-normal"> / day</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs Filter */}
        <div className="px-5 py-2.5 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-thin">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = selectedCategory === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#e8d5b5] text-slate-900 font-semibold shadow-md"
                    : "glass-pill text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-900" : "text-[#e8d5b5]"}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <div className="text-sm font-medium text-slate-200">
                Analyzing real-time venue telemetry for {destination || "your destination"}...
              </div>
              <p className="text-xs text-slate-400 max-w-sm text-center">
                Checking local dining rates, boutique stays, panoramic sunset vistas, and tranquil
                picnic spots matched to your {currencySymbol}{safeFormatNumber(safeTotalBudget)} budget.
              </p>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <div className="text-sm text-slate-200 font-semibold">{error}</div>
              <button
                onClick={fetchRecommendations}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No recommendations found for this category. Try selecting another tab above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {recommendations.map((item) => {
                const addedStatus = addedMap[item.id]
                const isFree =
                  item.estimatedCost === "Free" ||
                  item.estimatedCost === "0" ||
                  String(item.estimatedCost).toLowerCase().includes("free")

                return (
                  <div
                    key={item.id}
                    className="glass-shell p-4 rounded-2xl border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between gap-3 bg-white/[0.02]"
                  >
                    <div className="space-y-2">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium border flex items-center gap-1 ${getCategoryColor(
                            item.category
                          )}`}
                        >
                          {getCategoryIcon(item.category)}
                          {item.category || "Sightseeing"}
                        </span>

                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          {isFree ? (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
                              Free Admission
                            </span>
                          ) : (
                            <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-semibold">
                              ~{currencySymbol}
                              {safeFormatNumber(item.estimatedCost)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Location */}
                      <div>
                        <h3 className="font-editorial text-base sm:text-lg font-bold text-white">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">{item.location || destination}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      {/* Budget Fit Highlight */}
                      {item.budgetFit && (
                        <div className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{item.budgetFit}</span>
                        </div>
                      )}

                      {/* Meta Tags & Timing */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap pt-1">
                        {item.bestTime && (
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-sky-400" />
                            {item.bestTime}
                          </span>
                        )}
                        {item.duration && (
                          <span className="bg-white/5 px-2 py-0.5 rounded-md">
                            {item.duration}
                          </span>
                        )}
                        {Array.isArray(item.tags) &&
                          item.tags.slice(0, 2).map((t, i) => (
                            <span key={i} className="text-slate-400">
                              #{t}
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleAddToBucketList(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          addedStatus === "bucket"
                            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                            : "glass-pill text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {addedStatus === "bucket" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                            <span>In Bucket List</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                            <span>Bucket List</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleAddDirectlyToDay(item)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                          addedStatus === "day"
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "btn-luxe"
                        }`}
                      >
                        {addedStatus === "day" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-slate-950" />
                            <span>Added to Day {activeDayNumber || 1}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-slate-900" />
                            <span>Add to Day {activeDayNumber || 1}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Targeting Day {activeDayNumber || 1}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-white/15 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export function BudgetDiscoveryModal(props: BudgetDiscoveryModalProps) {
  if (!props.isOpen) return null

  return (
    <BudgetDiscoveryErrorBoundary onClose={props.onClose}>
      <BudgetDiscoveryModalInner {...props} />
    </BudgetDiscoveryErrorBoundary>
  )
}
