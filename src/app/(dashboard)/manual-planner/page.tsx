"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Save,
  Clock,
  DollarSign,
  ArrowRight,
  Sliders,
  CheckCircle2,
  FileText,
  Copy,
  Sparkles,
  RotateCcw,
  Pencil,
  ArrowUp,
  ArrowDown,
  X,
  PieChart,
  Check,
  Tag,
  AlertCircle,
  HelpCircle,
  Loader2,
  CalendarDays,
  Calculator,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  ActivityCard,
  ActivityItem,
  calculateDurationFromTimes,
  calculateEndTimeFromDuration,
} from "@/components/trip/activity-card"
import { TripCalculator } from "@/components/trip/trip-calculator"
import { useToast } from "@/hooks/use-toast"
import { useTravelStore, StoredTrip } from "@/lib/store/travel-store"
import { DESTINATIONS } from "@/lib/constants"
import { formatCurrency, CurrencyCode } from "@/lib/budget/budget-calculator"

interface ManualDay {
  dayNumber: number
  title: string
  activities: ActivityItem[]
}

const CURRENCIES: Array<{ code: CurrencyCode; symbol: string; rate: number; label: string }> = [
  { code: "USD", symbol: "$", rate: 1.0, label: "$ USD" },
  { code: "INR", symbol: "₹", rate: 86.5, label: "₹ INR" },
  { code: "EUR", symbol: "€", rate: 0.92, label: "€ EUR" },
  { code: "JPY", symbol: "¥", rate: 152.0, label: "¥ JPY" },
]

const CATEGORY_OPTIONS = [
  "Sightseeing",
  "Dining",
  "Stay",
  "Adventure",
  "Transport",
  "Culture & Nightlife",
  "Relaxation",
]

const DURATION_PRESETS = ["1h", "1.5h", "2h", "3h", "Half Day", "Full Day"]

const DEFAULT_DAYS: ManualDay[] = [
  {
    dayNumber: 1,
    title: "Arrival & Coastal Check-in",
    activities: [
      {
        id: "m-1",
        time: "14:00 — 15:00",
        startTime: "14:00",
        endTime: "15:00",
        title: "Check into Cliffside Villa",
        description: "Unpack and take in the panoramic views of the Tyrrhenian Sea.",
        location: "Positano",
        duration: "1h",
        estimatedCost: "350",
        category: "Stay",
      },
      {
        id: "m-2",
        time: "18:00 — 19:30",
        startTime: "18:00",
        endTime: "19:30",
        title: "Sunset Aperitivo at Franco's Bar",
        description: "Enjoy chilled Prosecco and local olives overlooking the colorful hillside.",
        location: "Positano Village",
        duration: "1.5h",
        estimatedCost: "40",
        category: "Dining",
      },
    ],
  },
  {
    dayNumber: 2,
    title: "Path of the Gods Hike",
    activities: [
      {
        id: "m-3",
        time: "08:30 — 12:00",
        startTime: "08:30",
        endTime: "12:00",
        title: "Sentiero degli Dei Trek",
        description: "Breathtaking coastal hiking trail high above the sea between Bomerano and Nocelle.",
        location: "Bomerano",
        duration: "3.5h",
        estimatedCost: "Free",
        category: "Adventure",
      },
    ],
  },
]

const STORAGE_KEY = "roveo_manual_draft_v1"

// Safe date helpers using UTC
function formatDisplayDate(dateStr: string, offsetDays: number = 0): string {
  if (!dateStr) return ""
  try {
    const [y, m, d] = dateStr.split("-").map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + offsetDays)
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
  } catch {
    return ""
  }
}

function calculateEndDate(dateStr: string, totalDays: number): string {
  if (!dateStr) return ""
  try {
    const [y, m, d] = dateStr.split("-").map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + Math.max(0, totalDays - 1))
    return dt.toISOString().split("T")[0]
  } catch {
    return dateStr
  }
}

function ManualPlannerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const addTrip = useTravelStore((state) => state.addTrip)

  const prefillDestination = searchParams.get("destination") || "Amalfi Coast, Italy"

  // Trip Master Header State
  const [tripTitle, setTripTitle] = React.useState("Custom Mediterranean Getaway")
  const [destination, setDestination] = React.useState(prefillDestination)
  const [startDate, setStartDate] = React.useState("2026-09-10")
  const [budget, setBudget] = React.useState("3000")
  const [currency, setCurrency] = React.useState<CurrencyCode>("USD")
  const [notes, setNotes] = React.useState("Remember to book ferry between Positano and Capri.")

  // Days and activities state
  const [days, setDays] = React.useState<ManualDay[]>(DEFAULT_DAYS)
  const [activeDayNumber, setActiveDayNumber] = React.useState(1)

  // Mobile Viewport Ergonomics (<1024px)
  const [mobileTab, setMobileTab] = React.useState<"trip" | "day" | "budget">("day")

  // Auto-Save Draft to localStorage (Requirement 8)
  const [isLoadedFromStorage, setIsLoadedFromStorage] = React.useState(false)
  const [hasAutoSaved, setHasAutoSaved] = React.useState(false)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.tripTitle) setTripTitle(parsed.tripTitle)
        if (parsed.destination) setDestination(parsed.destination)
        if (parsed.startDate) setStartDate(parsed.startDate)
        if (parsed.budget) setBudget(parsed.budget)
        if (parsed.currency) setCurrency(parsed.currency)
        if (parsed.notes) setNotes(parsed.notes)
        if (parsed.days && Array.isArray(parsed.days) && parsed.days.length > 0) {
          setDays(parsed.days)
        }
      }
    } catch (e) {
      // Ignore corrupted localStorage
    } finally {
      setIsLoadedFromStorage(true)
    }
  }, [])

  React.useEffect(() => {
    if (!isLoadedFromStorage) return
    const timeout = setTimeout(() => {
      try {
        const draft = {
          tripTitle,
          destination,
          startDate,
          budget,
          currency,
          notes,
          days,
          updatedAt: Date.now(),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
        setHasAutoSaved(true)
      } catch (e) {
        // Storage write error
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [tripTitle, destination, startDate, budget, currency, notes, days, isLoadedFromStorage])

  const handleResetTemplate = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    setTripTitle("Custom Mediterranean Getaway")
    setDestination(prefillDestination || "Amalfi Coast, Italy")
    setStartDate("2026-09-10")
    setBudget("3000")
    setCurrency("USD")
    setNotes("Remember to book ferry between Positano and Capri.")
    setDays(DEFAULT_DAYS)
    setActiveDayNumber(1)
    toast({
      title: "Template Reset",
      description: "Restored the default Mediterranean template.",
    })
  }

  // Active Currency Config
  const currentCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

  // Calculated End Date (Requirement 7)
  const computedEndDate = React.useMemo(() => {
    return calculateEndDate(startDate, days.length)
  }, [startDate, days.length])

  // Running Total Budget Calculations (Requirement 2)
  const totalPlannedCost = React.useMemo(() => {
    return days.reduce((sum, d) => {
      return (
        sum +
        d.activities.reduce((s, a) => {
          const raw = String(a.estimatedCost || "0").replace(/[^0-9.]/g, "")
          const num = Number(raw)
          return s + (isNaN(num) ? 0 : num)
        }, 0)
      )
    }, 0)
  }, [days])

  const numericTargetBudget = React.useMemo(() => {
    const raw = String(budget).replace(/[^0-9.]/g, "")
    const num = Number(raw)
    return isNaN(num) ? 0 : num
  }, [budget])

  const remainingBudget = numericTargetBudget - totalPlannedCost
  const budgetUtilization = numericTargetBudget > 0 ? (totalPlannedCost / numericTargetBudget) * 100 : 0

  // Category Cost Breakdown
  const categoryBreakdown = React.useMemo(() => {
    const breakdown: Record<string, { total: number; count: number }> = {}
    days.forEach((d) => {
      d.activities.forEach((a) => {
        const cat = a.category || "Sightseeing"
        const raw = String(a.estimatedCost || "0").replace(/[^0-9.]/g, "")
        const cost = Number(raw) || 0
        if (!breakdown[cat]) breakdown[cat] = { total: 0, count: 0 }
        breakdown[cat].total += cost
        breakdown[cat].count += 1
      })
    })
    return breakdown
  }, [days])

  // New Activity Form State (Requirement 4)
  const [isAddingActivity, setIsAddingActivity] = React.useState(false)
  const [newActStartTime, setNewActStartTime] = React.useState("10:00")
  const [newActEndTime, setNewActEndTime] = React.useState("11:30")
  const [newActTitle, setNewActTitle] = React.useState("")
  const [newActDesc, setNewActDesc] = React.useState("")
  const [newActLoc, setNewActLoc] = React.useState("")
  const [newActCost, setNewActCost] = React.useState("")
  const [newActCat, setNewActCat] = React.useState("Sightseeing")
  const [newActDuration, setNewActDuration] = React.useState("1.5h")

  // Inline Edit Form State (Requirement 5)
  const [editingActId, setEditingActId] = React.useState<string | null>(null)
  const [editStartTime, setEditStartTime] = React.useState("10:00")
  const [editEndTime, setEditEndTime] = React.useState("11:30")
  const [editTitle, setEditTitle] = React.useState("")
  const [editDesc, setEditDesc] = React.useState("")
  const [editLoc, setEditLoc] = React.useState("")
  const [editCost, setEditCost] = React.useState("")
  const [editCat, setEditCat] = React.useState("Sightseeing")
  const [editDuration, setEditDuration] = React.useState("1.5h")

  // AI Suggest Activity State (Requirement 9)
  const [isSuggesting, setIsSuggesting] = React.useState(false)

  // Simplified UI Toggles
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [isBudgetExpanded, setIsBudgetExpanded] = React.useState(false)
  const [showMoreAddFields, setShowMoreAddFields] = React.useState(false)
  const [showMoreEditFields, setShowMoreEditFields] = React.useState(false)

  // Interactive Trip Financial Calculator State
  const [isCalcOpen, setIsCalcOpen] = React.useState(false)
  const [calcTargetMode, setCalcTargetMode] = React.useState<"activity_new" | "activity_edit" | "budget">("activity_new")

  const handleOpenCalcForNewActivity = () => {
    setCalcTargetMode("activity_new")
    setIsCalcOpen(true)
  }

  const handleOpenCalcForEditActivity = () => {
    setCalcTargetMode("activity_edit")
    setIsCalcOpen(true)
  }

  const handleOpenCalcForBudget = () => {
    setCalcTargetMode("budget")
    setIsCalcOpen(true)
  }

  const handleApplyCostFromCalc = (amount: number) => {
    if (calcTargetMode === "activity_new") {
      setNewActCost(String(amount))
    } else if (calcTargetMode === "activity_edit") {
      setEditCost(String(amount))
    } else {
      setBudget(String(amount))
    }
  }

  const handleApplyTargetBudgetFromCalc = (amount: number) => {
    setBudget(String(amount))
  }

  // Active Day Resolution
  const activeDay = days.find((d) => d.dayNumber === activeDayNumber) || days[0] || {
    dayNumber: 1,
    title: "Day 1",
    activities: [],
  }

  // Day Management Handlers (Requirement 6)
  const handleAddDay = () => {
    const nextDayNum = days.length + 1
    const nextDayDate = formatDisplayDate(startDate, nextDayNum - 1)
    setDays((prev) => [
      ...prev,
      {
        dayNumber: nextDayNum,
        title: `Day ${nextDayNum}${nextDayDate ? ` (${nextDayDate})` : ""} Itinerary`,
        activities: [],
      },
    ])
    setActiveDayNumber(nextDayNum)
    toast({
      title: `Day ${nextDayNum} Added`,
      description: "You can now add custom activities for this day.",
    })
  }

  const handleDeleteDay = (dayNum: number) => {
    if (days.length <= 1) {
      toast({
        title: "Cannot Delete Day",
        description: "An itinerary must have at least one day.",
        variant: "destructive",
      })
      return
    }

    setDays((prev) => {
      const filtered = prev.filter((d) => d.dayNumber !== dayNum)
      return filtered.map((d, idx) => ({
        ...d,
        dayNumber: idx + 1,
      }))
    })

    setActiveDayNumber((prev) => {
      if (prev === dayNum) {
        return Math.max(1, dayNum - 1)
      }
      if (prev > dayNum) {
        return prev - 1
      }
      return prev
    })

    toast({
      title: "Day Removed",
      description: `Day ${dayNum} deleted and remaining days re-indexed.`,
    })
  }

  const handleUpdateDayTitle = (newTitle: string) => {
    setDays((prev) =>
      prev.map((d) => (d.dayNumber === activeDayNumber ? { ...d, title: newTitle } : d))
    )
  }

  // Activity Handlers (Requirements 1, 4, 5)
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newActTitle.trim()) return

    const cleanCost = newActCost ? newActCost.replace(/[^0-9.]/g, "") : ""
    const formattedTime =
      newActStartTime && newActEndTime
        ? `${newActStartTime} — ${newActEndTime}`
        : newActStartTime || newActEndTime || "10:00"

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      time: formattedTime,
      startTime: newActStartTime || "10:00",
      endTime: newActEndTime || "11:30",
      title: newActTitle.trim(),
      description: newActDesc.trim(),
      location: newActLoc.trim(),
      duration: newActDuration.trim() || "1.5h",
      estimatedCost: cleanCost ? cleanCost : "Free",
      category: newActCat,
    }

    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDayNumber ? { ...d, activities: [...d.activities, newActivity] } : d
      )
    )

    setNewActTitle("")
    setNewActDesc("")
    setNewActLoc("")
    setNewActCost("")
    setNewActDuration("1.5h")
    setNewActStartTime("10:00")
    setNewActEndTime("11:30")
    setIsAddingActivity(false)
    setShowMoreAddFields(false)

    toast({
      title: "Experience Saved",
      description: `"${newActivity.title}" added to Day ${activeDayNumber}.`,
    })
  }

  const handleStartEdit = (act: ActivityItem) => {
    setEditingActId(act.id)

    // Resolve start and end times
    let sTime = act.startTime || ""
    let eTime = act.endTime || ""
    if (!sTime && act.time) {
      if (act.time.includes("—")) {
        const [s, e] = act.time.split("—").map((p) => p.trim())
        sTime = s || "10:00"
        eTime = e || ""
      } else if (act.time.includes("-")) {
        const [s, e] = act.time.split("-").map((p) => p.trim())
        sTime = s || "10:00"
        eTime = e || ""
      } else {
        sTime = act.time
      }
    }
    if (!sTime) sTime = "10:00"
    if (!eTime) {
      eTime = calculateEndTimeFromDuration(sTime, act.duration || "1.5h")
    }

    setEditStartTime(sTime)
    setEditEndTime(eTime)
    setEditTitle(act.title || "")
    setEditDesc(act.description || "")
    setEditLoc(act.location || "")
    const rawCost = String(act.estimatedCost || "").replace(/[^0-9.]/g, "")
    setEditCost(rawCost === "0" || String(act.estimatedCost).toLowerCase() === "free" ? "" : rawCost)
    setEditCat(act.category || "Sightseeing")
    setEditDuration(act.duration || "1.5h")
    setShowMoreEditFields(false)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim() || !editingActId) return

    const cleanCost = editCost.trim() ? editCost.trim().replace(/[^0-9.]/g, "") : ""
    const formattedTime =
      editStartTime && editEndTime
        ? `${editStartTime} — ${editEndTime}`
        : editStartTime || editEndTime || "10:00"

    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDayNumber
          ? {
              ...d,
              activities: d.activities.map((a) =>
                a.id === editingActId
                  ? {
                      ...a,
                      time: formattedTime,
                      startTime: editStartTime || "10:00",
                      endTime: editEndTime || "11:30",
                      title: editTitle.trim(),
                      description: editDesc.trim(),
                      location: editLoc.trim(),
                      duration: editDuration.trim() || "1.5h",
                      estimatedCost: cleanCost ? cleanCost : "Free",
                      category: editCat,
                    }
                  : a
              ),
            }
          : d
      )
    )

    setEditingActId(null)
    setShowMoreEditFields(false)
    toast({
      title: "Experience Updated",
      description: `"${editTitle}" updated in Day ${activeDayNumber}.`,
    })
  }

  const handleMoveActivity = (dayNum: number, actId: string, direction: "up" | "down") => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayNumber !== dayNum) return d
        const idx = d.activities.findIndex((a) => a.id === actId)
        if (idx === -1) return d
        const targetIdx = direction === "up" ? idx - 1 : idx + 1
        if (targetIdx < 0 || targetIdx >= d.activities.length) return d

        const newActs = [...d.activities]
        const temp = newActs[idx]
        newActs[idx] = newActs[targetIdx]
        newActs[targetIdx] = temp
        return { ...d, activities: newActs }
      })
    )
  }

  const handleDeleteActivity = (activityId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDayNumber
          ? { ...d, activities: d.activities.filter((a) => a.id !== activityId) }
          : d
      )
    )
    toast({
      title: "Experience Removed",
      description: "Activity deleted from your itinerary.",
    })
  }

  // AI Suggest Stop (Requirement 9)
  const handleAiSuggestStop = async () => {
    if (isSuggesting) return
    setIsSuggesting(true)

    try {
      const res = await fetch("/api/ai/suggest-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          dayTitle: activeDay.title,
          existingActivities: activeDay.activities,
          currency,
        }),
      })

      const data = await res.json()
      if (data.activity) {
        const sTime = data.activity.startTime || data.activity.time || "15:00"
        const dur = data.activity.duration || "1.5h"
        const eTime = data.activity.endTime || calculateEndTimeFromDuration(sTime, dur)
        const formattedTime = sTime && eTime ? `${sTime} — ${eTime}` : sTime

        const suggested: ActivityItem = {
          id: `act-${Date.now()}`,
          time: formattedTime,
          startTime: sTime,
          endTime: eTime,
          title: data.activity.title,
          description: data.activity.description,
          location: data.activity.location,
          duration: dur,
          estimatedCost: data.activity.estimatedCost
            ? String(data.activity.estimatedCost).replace(/[^0-9.]/g, "")
            : "Free",
          category: data.activity.category || "Sightseeing",
        }

        setDays((prev) =>
          prev.map((d) =>
            d.dayNumber === activeDayNumber
              ? { ...d, activities: [...d.activities, suggested] }
              : d
          )
        )

        toast({
          title: "✨ Experience Curated",
          description: `Added "${suggested.title}" to Day ${activeDayNumber}.`,
        })
      }
    } catch (err) {
      toast({
        title: "Suggestion Notice",
        description: "Could not generate suggestion at this moment.",
        variant: "destructive",
      })
    } finally {
      setIsSuggesting(false)
    }
  }

  // Copy Dossier (Requirement 9)
  const handleCopyItinerary = () => {
    const totalCostFormatted = formatCurrency(totalPlannedCost, currency)
    const targetBudgetFormatted = formatCurrency(numericTargetBudget, currency)

    let text = `ROVEO Bespoke Manual Itinerary: ${tripTitle}\n`
    text += `Destination: ${destination}\n`
    text += `Duration: ${startDate} to ${computedEndDate} (${days.length} Days)\n`
    text += `Financial Telemetry: Planned ${totalCostFormatted} / Target ${targetBudgetFormatted} (${currency})\n`
    if (notes) text += `Personal Notes: ${notes}\n`
    text += `\n────────────────────────────────────────────────\n\n`

    days.forEach((d) => {
      const dayDate = formatDisplayDate(startDate, d.dayNumber - 1)
      text += `DAY ${d.dayNumber}${dayDate ? ` • ${dayDate}` : ""}: ${d.title}\n`
      if (d.activities.length === 0) {
        text += `  (No planned experiences yet)\n`
      } else {
        d.activities.forEach((a) => {
          const costStr = a.estimatedCost ? formatCurrency(a.estimatedCost, currency) : "Free"
          const timeDisplay =
            a.startTime && a.endTime
              ? `${a.startTime} — ${a.endTime}`
              : a.startTime || a.time || "Scheduled"
          text += `  • ${timeDisplay} — ${a.title} [${a.category || "Sightseeing"}] (${a.duration || "1.5h"})\n`
          if (a.location) text += `    Location: ${a.location}\n`
          text += `    Cost: ${costStr}\n`
          if (a.description) text += `    Details: ${a.description}\n`
        })
      }
      text += `\n`
    })

    navigator.clipboard.writeText(text)
    toast({
      title: "Dossier Copied to Clipboard",
      description: "Full formatted itinerary summary copied.",
    })
  }

  // Save Trip to Store
  const handleSaveTrip = () => {
    const matchedDest = DESTINATIONS.find(
      (d) =>
        d.name.toLowerCase() === destination.toLowerCase() ||
        destination.toLowerCase().includes(d.name.toLowerCase())
    )
    const coverImage = matchedDest
      ? matchedDest.image
      : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80"

    const newTripId = `trip-${Date.now()}`
    const newTrip: StoredTrip = {
      id: newTripId,
      title: tripTitle || `Journey to ${destination}`,
      destination: destination,
      dates: `${startDate} — ${computedEndDate}`,
      startDate: startDate,
      endDate: computedEndDate,
      daysCount: days.length,
      travelers: 2,
      budget: budget ? formatCurrency(numericTargetBudget, currency) : undefined,
      status: "planning",
      planningMode: "Manual Studio",
      coverImage: coverImage,
      notes: notes,
      coordinates: [40.634, 14.6027],
      days: days.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        activities: d.activities.map((a) => ({
          id: a.id,
          time: a.time,
          startTime: a.startTime,
          endTime: a.endTime,
          title: a.title,
          description: a.description,
          location: a.location,
          duration: a.duration,
          estimatedCost: a.estimatedCost ? String(a.estimatedCost) : "Free",
          category: a.category,
        })),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addTrip(newTrip)
    toast({
      title: "Journey Created & Saved",
      description: `"${newTrip.title}" has been saved to your travel archive.`,
    })
    router.push(`/trips/${newTrip.id}`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24 px-3 sm:px-0">
      {/* ─── 1. TOP HEADER & QUICK CONTROLS ──────────────────────────────── */}
      <div className="glass-shell p-5 sm:p-6 rounded-3xl border border-white/15 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="editorial-tag text-[#e8d5b5]">Trip Planner</span>
            {hasAutoSaved && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 glass-pill px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-saved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h1 className="font-editorial text-2xl sm:text-4xl font-bold tracking-tight text-white truncate">
              {tripTitle || "Custom Itinerary"}
            </h1>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#38bdf8] hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="Edit Trip Details"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
            <span className="flex items-center gap-1 text-[#38bdf8] font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {destination || "Set destination"}
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-[#e8d5b5]" />
              {formatDisplayDate(startDate)} — {formatDisplayDate(computedEndDate)} ({days.length} Days)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Currency Switcher */}
          <div className="flex items-center glass-pill rounded-full p-0.5 border border-white/10">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                  currency === c.code
                    ? "bg-[#e8d5b5] text-[#050a10] shadow-[0_0_8px_rgba(232,213,181,0.4)]"
                    : "text-slate-400 hover:text-white"
                }`}
                title={`Switch to ${c.label}`}
              >
                {c.symbol} {c.code}
              </button>
            ))}
          </div>

          {/* Edit Trip Details Button */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`glass-pill px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSettingsOpen ? "bg-white/20 text-white border-white/40 shadow-sm" : "text-slate-200 hover:text-white"
            }`}
            title="Edit destination, dates, and target budget"
          >
            <Sliders className="w-3.5 h-3.5 text-[#e8d5b5]" />
            <span>{isSettingsOpen ? "Hide Settings" : "Trip Details"}</span>
            {isSettingsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Copy Dossier */}
          <button
            onClick={handleCopyItinerary}
            className="glass-pill px-3 py-2 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            title="Copy Itinerary summary"
          >
            <Copy className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="hidden sm:inline">Copy</span>
          </button>

          {/* Save Journey Primary Button */}
          <button
            onClick={handleSaveTrip}
            className="btn-luxe px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#050a10]" />
            <span>Save Journey</span>
          </button>
        </div>
      </div>

      {/* ─── 2. COLLAPSIBLE TRIP DETAILS (Opens smoothly when user wants to edit) ─── */}
      {isSettingsOpen && (
        <div className="glass-shell p-6 rounded-3xl border border-white/20 shadow-2xl space-y-4 animate-reveal bg-[#050a10]/80">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="editorial-tag text-[#e8d5b5] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#38bdf8]" />
              Trip Configuration & Parameters
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetTemplate}
                className="text-xs text-rose-400/80 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                title="Reset to default template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Template</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs text-slate-300 hover:text-white glass-pill px-3 py-1 rounded-full cursor-pointer"
              >
                Done ✓
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Trip Title</label>
              <input
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white"
                placeholder="e.g. Kyoto Zen Retreat"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Destination</label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white"
                placeholder="e.g. Amalfi Coast, Italy"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                  Budget ({currentCurrency.symbol})
                </label>
                <button
                  type="button"
                  onClick={handleOpenCalcForBudget}
                  className="text-[9px] text-[#38bdf8] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-2.5 h-2.5" />
                  <span>Calc</span>
                </button>
              </div>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white font-mono"
                placeholder="3000"
              />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#38bdf8]" />
              Trip Notes & Reservations
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record hotel reservations, packing reminders, flight codes..."
              rows={2}
              className="w-full glass-input rounded-xl p-3 text-xs text-white"
            />
          </div>
        </div>
      )}

      {/* ─── 3. SLEEK COMPACT BUDGET BAR (Progress + Quick Stats) ─────────── */}
      <div className="glass-shell p-4 sm:p-5 rounded-2xl border border-white/15 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[#38bdf8] shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-white">
                  Planned: <span className="text-[#38bdf8] font-mono">{formatCurrency(totalPlannedCost, currency)}</span>
                </span>
                <span className="text-xs text-white/30">•</span>
                <span className="text-xs text-slate-300">
                  Target: <span className="font-mono text-white">{formatCurrency(numericTargetBudget, currency)}</span>
                </span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                    remainingBudget < 0
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : budgetUtilization >= 85
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {remainingBudget < 0
                    ? `${formatCurrency(Math.abs(remainingBudget), currency)} over budget`
                    : `${formatCurrency(remainingBudget, currency)} remaining`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenCalcForBudget}
              className="glass-pill px-2.5 py-1 text-xs text-[#38bdf8] hover:text-white flex items-center gap-1 cursor-pointer font-medium"
              title="Open expense calculator"
            >
              <Calculator className="w-3 h-3" />
              <span>Calculator</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBudgetExpanded(!isBudgetExpanded)}
              className="glass-pill px-2.5 py-1 text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <PieChart className="w-3 h-3 text-[#e8d5b5]" />
              <span>{isBudgetExpanded ? "Hide Categories" : "Categories"}</span>
              {isBudgetExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Clean, slim progress line */}
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
          <div
            style={{ width: `${Math.min(100, Math.max(0, budgetUtilization))}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              remainingBudget < 0
                ? "bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                : budgetUtilization >= 85
                ? "bg-gradient-to-r from-[#38bdf8] to-amber-400"
                : "bg-gradient-to-r from-[#38bdf8] to-[#34d399]"
            }`}
          />
        </div>

        {/* Expandable Category Pills */}
        {isBudgetExpanded && (
          <div className="pt-2 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 animate-reveal">
            {[
              { cat: "Stay", label: "Stays", icon: "🏨" },
              { cat: "Dining", label: "Dining", icon: "🍷" },
              { cat: "Sightseeing", label: "Sightseeing", icon: "🏛️" },
              { cat: "Adventure", label: "Adventure", icon: "🥾" },
              { cat: "Transport", label: "Transit", icon: "🚆" },
              { cat: "Culture & Nightlife", label: "Culture", icon: "✨" },
            ].map((item) => {
              const data = categoryBreakdown[item.cat] || { total: 0, count: 0 }
              return (
                <div key={item.cat} className="glass-card p-2.5 rounded-xl space-y-0.5 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="font-mono text-[9px]">{data.count}</span>
                  </div>
                  <div className="font-semibold text-white font-mono text-[11px]">
                    {formatCurrency(data.total, currency)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── 4. HORIZONTAL DAY TABS BAR (Effortless 1-click day switching) ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {days.map((day) => {
          const isSelected = day.dayNumber === activeDayNumber
          const dayDate = formatDisplayDate(startDate, day.dayNumber - 1)
          return (
            <button
              key={day.dayNumber}
              type="button"
              onClick={() => setActiveDayNumber(day.dayNumber)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? "bg-[#e8d5b5] text-[#050a10] border-[#e8d5b5] shadow-[0_0_15px_rgba(232,213,181,0.3)]"
                  : "glass-card text-slate-300 hover:text-white hover:border-white/20"
              }`}
            >
              <span>Day {day.dayNumber}</span>
              {dayDate && (
                <span className={`text-[10px] font-mono ${isSelected ? "text-[#050a10]/70" : "text-slate-400"}`}>
                  • {dayDate}
                </span>
              )}
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? "bg-[#050a10]/20 text-[#050a10]" : "bg-white/10 text-slate-400"
              }`}>
                {day.activities.length}
              </span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={handleAddDay}
          className="glass-pill px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#38bdf8] hover:text-white flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border-dashed border-[#38bdf8]/40 hover:border-[#38bdf8]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Day</span>
        </button>
      </div>

      {/* ─── 5. ACTIVE DAY WORKSPACE ───────────────────────────────────────── */}
      <div className="glass-shell p-5 sm:p-7 rounded-3xl border border-white/15 shadow-2xl space-y-6">
        {/* Day Header with Inline Edit and Fast Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="editorial-tag text-[#38bdf8]">
                Day {activeDay.dayNumber}
              </span>
              {formatDisplayDate(startDate, activeDay.dayNumber - 1) && (
                <span className="text-[10px] font-mono text-[#e8d5b5] glass-pill px-2 py-0.5 rounded-full">
                  {formatDisplayDate(startDate, activeDay.dayNumber - 1)}
                </span>
              )}
              {days.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteDay(activeDay.dayNumber)}
                  className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1 ml-2 transition-colors cursor-pointer"
                  title={`Delete Day ${activeDay.dayNumber}`}
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-[10px]">Remove Day</span>
                </button>
              )}
            </div>

            <input
              type="text"
              value={activeDay.title}
              onChange={(e) => handleUpdateDayTitle(e.target.value)}
              className="w-full bg-transparent font-editorial text-xl sm:text-2xl font-bold text-white border-b border-transparent hover:border-white/20 focus:border-[#e8d5b5] focus:outline-none transition-colors py-0.5"
              placeholder="Name this day (e.g. Coastal Exploration)"
              title="Click to rename day focus title"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* AI Suggest Experience */}
            <button
              type="button"
              onClick={handleAiSuggestStop}
              disabled={isSuggesting}
              className="glass-pill px-3 py-2 text-xs font-semibold text-[#e8d5b5] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="AI automatically suggests a contextual experience"
            >
              {isSuggesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#38bdf8]" />
                  <span>Curating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>AI Suggest</span>
                </>
              )}
            </button>

            {!isAddingActivity && (
              <button
                onClick={() => setIsAddingActivity(true)}
                className="btn-luxe px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5 text-[#050a10]" />
                <span>Add Activity</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── ADD ACTIVITY FORM (Streamlined, frictionless entry) ─── */}
        {isAddingActivity && (
          <form
            onSubmit={handleSaveActivity}
            className="p-5 rounded-2xl glass-dock border border-[#38bdf8]/40 space-y-4 animate-reveal bg-[#050a10]/95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
                <span className="text-xs font-semibold text-white">Add Experience to Day {activeDay.dayNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingActivity(false)
                  setShowMoreAddFields(false)
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Activity Title */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                Activity Name *
              </label>
              <input
                value={newActTitle}
                onChange={(e) => setNewActTitle(e.target.value)}
                placeholder="e.g. Visit Amalfi Cathedral, Seafood Lunch at Marina, Sunset Cruise..."
                className="w-full glass-input rounded-xl h-10 px-3 text-xs sm:text-sm text-white focus:border-[#38bdf8]"
                required
                autoFocus
              />
            </div>

            {/* 2. Timing: Start Time & End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3 text-[#38bdf8]" />
                  Start Time *
                </label>
                <input
                  type="time"
                  value={newActStartTime}
                  onChange={(e) => {
                    const val = e.target.value
                    setNewActStartTime(val)
                    if (val) {
                      setNewActEndTime(calculateEndTimeFromDuration(val, newActDuration))
                    }
                  }}
                  className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3 text-[#34d399]" />
                  End Time *
                </label>
                <input
                  type="time"
                  value={newActEndTime}
                  onChange={(e) => {
                    const val = e.target.value
                    setNewActEndTime(val)
                    if (newActStartTime && val) {
                      const derived = calculateDurationFromTimes(newActStartTime, val)
                      if (derived) setNewActDuration(derived)
                    }
                  }}
                  className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white font-mono"
                  required
                />
              </div>
            </div>

            {/* 3. Location & Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                  Location <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  value={newActLoc}
                  onChange={(e) => setNewActLoc(e.target.value)}
                  placeholder="e.g. Positano Marina"
                  className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                    Cost ({currentCurrency.symbol}) <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenCalcForNewActivity}
                    className="text-[9px] text-[#38bdf8] hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Calculator className="w-2.5 h-2.5" />
                    <span>Calc</span>
                  </button>
                </div>
                <input
                  type="number"
                  value={newActCost}
                  onChange={(e) => setNewActCost(e.target.value)}
                  placeholder="0 for Free"
                  className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Optional "More options" accordion */}
            {!showMoreAddFields ? (
              <button
                type="button"
                onClick={() => setShowMoreAddFields(true)}
                className="text-[11px] text-[#38bdf8] hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer pt-1"
              >
                <span>+ Add Category, Presets & Notes</span>
              </button>
            ) : (
              <div className="space-y-3 pt-2 border-t border-white/10 animate-reveal">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Category</label>
                    <select
                      value={newActCat}
                      onChange={(e) => setNewActCat(e.target.value)}
                      className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white bg-[#050a10]"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Quick Duration Presets</label>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {DURATION_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setNewActDuration(preset)
                            if (newActStartTime) {
                              const end = calculateEndTimeFromDuration(newActStartTime, preset)
                              if (end) setNewActEndTime(end)
                            }
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            newActDuration === preset
                              ? "bg-[#38bdf8]/20 border-[#38bdf8] text-white"
                              : "glass-pill text-slate-400 hover:text-white"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Notes & Details</label>
                  <textarea
                    value={newActDesc}
                    onChange={(e) => setNewActDesc(e.target.value)}
                    placeholder="Reservation codes, attire recommendations, tips..."
                    rows={2}
                    className="w-full glass-input rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsAddingActivity(false)
                  setShowMoreAddFields(false)
                }}
                className="glass-pill px-4 py-2 text-xs text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-luxe px-5 py-2 text-xs font-semibold cursor-pointer shadow-lg"
              >
                Add Experience
              </button>
            </div>
          </form>
        )}

        {/* ─── ACTIVITIES TIMELINE ─────────────────────────────────────────── */}
        <div className="space-y-3">
          {activeDay.activities.map((act, actIdx) => {
            if (editingActId === act.id) {
              return (
                <form
                  key={act.id}
                  onSubmit={handleSaveEdit}
                  className="p-5 rounded-2xl glass-dock border border-[#38bdf8]/40 space-y-4 animate-reveal bg-[#050a10]/95"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-semibold text-[#38bdf8] flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Experience
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingActId(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Activity Name *</label>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full glass-input rounded-xl h-10 px-3 text-xs sm:text-sm text-white"
                      required
                    />
                  </div>

                  {/* 2. Start Time & End Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-[#38bdf8]" />
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={editStartTime}
                        onChange={(e) => {
                          const val = e.target.value
                          setEditStartTime(val)
                          if (val) {
                            setEditEndTime(calculateEndTimeFromDuration(val, editDuration))
                          }
                        }}
                        className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-[#34d399]" />
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={editEndTime}
                        onChange={(e) => {
                          const val = e.target.value
                          setEditEndTime(val)
                          if (editStartTime && val) {
                            const derived = calculateDurationFromTimes(editStartTime, val)
                            if (derived) setEditDuration(derived)
                          }
                        }}
                        className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* 3. Location & Cost */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Location</label>
                      <input
                        value={editLoc}
                        onChange={(e) => setEditLoc(e.target.value)}
                        className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                          Cost ({currentCurrency.symbol})
                        </label>
                        <button
                          type="button"
                          onClick={handleOpenCalcForEditActivity}
                          className="text-[9px] text-[#38bdf8] hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Calculator className="w-2.5 h-2.5" />
                          <span>Calc</span>
                        </button>
                      </div>
                      <input
                        type="number"
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value)}
                        placeholder="0 for Free"
                        className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Optional More Edit Options */}
                  {!showMoreEditFields ? (
                    <button
                      type="button"
                      onClick={() => setShowMoreEditFields(true)}
                      className="text-[11px] text-[#38bdf8] hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer pt-1"
                    >
                      <span>+ Edit Category, Presets & Notes</span>
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-white/10 animate-reveal">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Category</label>
                          <select
                            value={editCat}
                            onChange={(e) => setEditCat(e.target.value)}
                            className="w-full glass-input rounded-xl h-9 px-3 text-xs text-white bg-[#050a10]"
                          >
                            {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Quick Duration Presets</label>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {DURATION_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setEditDuration(preset)
                                  if (editStartTime) {
                                    const end = calculateEndTimeFromDuration(editStartTime, preset)
                                    if (end) setEditEndTime(end)
                                  }
                                }}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                  editDuration === preset
                                    ? "bg-[#38bdf8]/20 border-[#38bdf8] text-white"
                                    : "glass-pill text-slate-400 hover:text-white"
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Description</label>
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={2}
                          className="w-full glass-input rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingActId(null)}
                      className="glass-pill px-4 py-2 text-xs text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-luxe px-5 py-2 text-xs font-semibold cursor-pointer shadow-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )
            }

            return (
              <ActivityCard
                key={act.id}
                activity={act}
                onDelete={handleDeleteActivity}
                onEdit={handleStartEdit}
                onMoveUp={() => handleMoveActivity(activeDay.dayNumber, act.id, "up")}
                onMoveDown={() => handleMoveActivity(activeDay.dayNumber, act.id, "down")}
                canMoveUp={actIdx > 0}
                canMoveDown={actIdx < activeDay.activities.length - 1}
                currencySymbol={currentCurrency.symbol}
                editable={true}
              />
            )
          })}

          {activeDay.activities.length === 0 && !isAddingActivity && (
            <div className="text-center py-12 glass-card rounded-2xl border border-white/10 space-y-3">
              <Clock className="w-8 h-8 text-[#94a3b8] mx-auto stroke-1" />
              <p className="text-xs text-[#94a3b8]">
                No activities planned for {activeDay.title} yet.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={handleAiSuggestStop}
                  disabled={isSuggesting}
                  className="glass-pill px-4 py-2 text-xs text-[#e8d5b5] hover:text-white rounded-full cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>AI Suggest Stop</span>
                </button>
                <button
                  onClick={() => setIsAddingActivity(true)}
                  className="btn-luxe px-4 py-2 text-xs font-semibold rounded-full cursor-pointer"
                >
                  + Add Experience
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Trip Financial & Split Calculator Modal */}
      <TripCalculator
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        currency={currency}
        currentPlannedTotal={totalPlannedCost}
        currentTargetBudget={numericTargetBudget}
        daysCount={days.length}
        onApplyCost={handleApplyCostFromCalc}
        onApplyTargetBudget={handleApplyTargetBudgetFromCalc}
      />
    </div>
  )
}

export default function ManualPlannerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#e8d5b5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#94a3b8]">Opening manual builder...</p>
        </div>
      }
    >
      <ManualPlannerContent />
    </React.Suspense>
  )
}
