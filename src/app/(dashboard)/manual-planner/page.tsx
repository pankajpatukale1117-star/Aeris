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
  Bookmark,
  Navigation,
  SlidersHorizontal,
  ListPlus,
  Download,
} from "lucide-react"

// Drag and Drop (dnd-kit)
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

// Components & Types
import {
  ActivityCard,
  ActivityItem,
  calculateDurationFromTimes,
  calculateEndTimeFromDuration,
} from "@/components/trip/activity-card"
import { QuickAddBar } from "@/components/planner/quick-add-bar"
import { SortableActivityCard } from "@/components/planner/sortable-activity-card"
import { ScratchpadTray, StagedItem } from "@/components/planner/scratchpad-tray"
import { PlannerMapPanel } from "@/components/planner/planner-map-panel"
import { TripCalculator } from "@/components/trip/trip-calculator"

// Utilities & Hooks
import { useToast } from "@/hooks/use-toast"
import { useTravelStore, StoredTrip } from "@/lib/store/travel-store"
import { DESTINATIONS } from "@/lib/constants"
import { formatCurrency, CurrencyCode } from "@/lib/budget/budget-calculator"
import { ParsedActivity } from "@/lib/planner/quick-add-parser"
import { DayTemplate, QuickStamp } from "@/lib/planner/day-templates"
import { exportToICalendar } from "@/lib/planner/calendar-exporter"
import {
  estimateTransit,
  resolveCoordinates,
  TransitEstimate,
} from "@/lib/planner/route-optimizer"

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

const DURATION_PRESETS = ["30m", "45m", "1h", "1.5h", "2h", "3h", "Half Day", "Full Day"]

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
        description: "Unpack and take in panoramic views of the Tyrrhenian Sea.",
        location: "Positano",
        duration: "1h",
        estimatedCost: "350",
        category: "Stay",
        bookingStatus: "reserved",
      },
      {
        id: "m-2",
        time: "18:00 — 19:30",
        startTime: "18:00",
        endTime: "19:30",
        title: "Sunset Aperitivo at Franco's Bar",
        description: "Chilled Prosecco and local olives overlooking the hillside.",
        location: "Positano Village",
        duration: "1.5h",
        estimatedCost: "40",
        category: "Dining",
        bookingStatus: "wishlist",
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
        bookingStatus: "wishlist",
      },
    ],
  },
]

const DEFAULT_STAGED_ITEMS: StagedItem[] = [
  {
    id: "staged-1",
    title: "Gelato tasting at Buca di Bacco",
    location: "Spiaggia Grande",
    estimatedCost: "15",
    category: "Dining",
    notes: "Try pistachio and lemon gelato",
  },
  {
    id: "staged-2",
    title: "Private sunset boat to Faraglioni rocks",
    location: "Marina Grande, Capri",
    estimatedCost: "220",
    category: "Adventure",
    notes: "Requires advance booking before 4 PM",
  },
]

const STORAGE_KEY = "roveo_manual_draft_v1"
const SCRATCHPAD_KEY = "roveo_manual_scratchpad_v1"

const DESTINATION_COORDS: Record<string, [number, number]> = {
  "santorini-greece": [36.3932, 25.4615],
  "kyoto-japan": [35.0116, 135.7681],
  "bali-indonesia": [-8.4095, 115.1889],
  "paris-france": [48.8566, 2.3522],
  "machu-picchu-peru": [-13.1631, -72.545],
  maldives: [3.2028, 73.2207],
  "iceland-aurora": [64.1466, -21.9426],
  "safari-kenya": [-1.2921, 36.8219],
  "amalfi-coast-italy": [40.634, 14.6027],
  "new-york-city-usa": [40.7128, -74.006],
  "bangkok-thailand": [13.7563, 100.5018],
  "new-zealand-south-island": [-45.0312, 168.6626],
  "patagonia-argentina": [-50.0, -73.0],
  "dubai-uae": [25.2048, 55.2708],
  "prague-czech-republic": [50.0755, 14.4378],
  "marrakech-morocco": [31.6295, -7.9811],
  "costa-rica": [9.7489, -83.7534],
  "swiss-alps": [46.5606, 7.9147],
  "rio-de-janeiro-brazil": [-22.9068, -43.1729],
  singapore: [1.3521, 103.8198],
}

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

  // Unassigned Bucket List / Scratchpad Tray State
  const [isScratchpadOpen, setIsScratchpadOpen] = React.useState(false)
  const [stagedItems, setStagedItems] = React.useState<StagedItem[]>(DEFAULT_STAGED_ITEMS)

  // Interactive Map Split Panel State
  const [isMapOpen, setIsMapOpen] = React.useState(false)

  // Auto-Save Draft to localStorage
  const [isLoadedFromStorage, setIsLoadedFromStorage] = React.useState(false)
  const [hasAutoSaved, setHasAutoSaved] = React.useState(false)

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
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

      const savedStaged = localStorage.getItem(SCRATCHPAD_KEY)
      if (savedStaged) {
        const parsedStaged = JSON.parse(savedStaged)
        if (Array.isArray(parsedStaged)) {
          setStagedItems(parsedStaged)
        }
      }
    } catch (e) {
      // Ignore corrupted localStorage
    } finally {
      setIsLoadedFromStorage(true)
    }
  }, [])

  // Auto-save draft changes
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
        localStorage.setItem(SCRATCHPAD_KEY, JSON.stringify(stagedItems))
        setHasAutoSaved(true)
      } catch (e) {
        // Storage write error
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [tripTitle, destination, startDate, budget, currency, notes, days, stagedItems, isLoadedFromStorage])

  const handleResetTemplate = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(SCRATCHPAD_KEY)
    } catch {}
    setTripTitle("Custom Mediterranean Getaway")
    setDestination(prefillDestination || "Amalfi Coast, Italy")
    setStartDate("2026-09-10")
    setBudget("3000")
    setCurrency("USD")
    setNotes("Remember to book ferry between Positano and Capri.")
    setDays(DEFAULT_DAYS)
    setStagedItems(DEFAULT_STAGED_ITEMS)
    setActiveDayNumber(1)
    toast({
      title: "Template Reset",
      description: "Restored the default Mediterranean template.",
    })
  }

  // Active Currency Config
  const currentCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

  // Calculated End Date
  const computedEndDate = React.useMemo(() => {
    return calculateEndDate(startDate, days.length)
  }, [startDate, days.length])

  // Destination Center Coordinates for Map & Routing
  const destinationCenter: [number, number] = React.useMemo(() => {
    const matched = DESTINATIONS.find(
      (d) =>
        d.name.toLowerCase() === destination.toLowerCase() ||
        destination.toLowerCase().includes(d.name.toLowerCase()) ||
        d.id.toLowerCase() === destination.toLowerCase()
    )
    if (matched && DESTINATION_COORDS[matched.id]) {
      return DESTINATION_COORDS[matched.id]
    }
    const destClean = destination.toLowerCase().replace(/[^a-z]/g, "")
    const key = Object.keys(DESTINATION_COORDS).find((k) =>
      destClean.includes(k.split("-")[0])
    )
    if (key) return DESTINATION_COORDS[key]

    return [40.634, 14.6027] // Default Amalfi Coast
  }, [destination])

  // Running Total Budget Calculations
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

  // Active Day Resolution
  const activeDay = days.find((d) => d.dayNumber === activeDayNumber) || days[0] || {
    dayNumber: 1,
    title: "Day 1",
    activities: [],
  }

  const allDayNumbers = React.useMemo(() => days.map((d) => d.dayNumber), [days])

  // Smart Start Time calculation for next activity (chaining from previous end time)
  const defaultStartTime = React.useMemo(() => {
    if (activeDay.activities.length === 0) return "09:00"
    const last = activeDay.activities[activeDay.activities.length - 1]
    return last.endTime || "14:00"
  }, [activeDay.activities])

  // Consecutive Transit Estimates on Active Day
  const transitEstimates = React.useMemo(() => {
    const estimates: Array<TransitEstimate | null> = []
    const acts = activeDay.activities
    for (let i = 0; i < acts.length; i++) {
      if (i < acts.length - 1) {
        const p1 = resolveCoordinates(acts[i], destinationCenter, i)
        const p2 = resolveCoordinates(acts[i + 1], destinationCenter, i + 1)
        estimates.push(estimateTransit(p1, p2))
      } else {
        estimates.push(null)
      }
    }
    return estimates
  }, [activeDay.activities, destinationCenter])

  // New Activity Form State (Manual modal / detailed view)
  const [isAddingActivity, setIsAddingActivity] = React.useState(false)
  const [newActStartTime, setNewActStartTime] = React.useState("10:00")
  const [newActEndTime, setNewActEndTime] = React.useState("11:30")
  const [newActTitle, setNewActTitle] = React.useState("")
  const [newActDesc, setNewActDesc] = React.useState("")
  const [newActLoc, setNewActLoc] = React.useState("")
  const [newActCost, setNewActCost] = React.useState("")
  const [newActCat, setNewActCat] = React.useState("Sightseeing")
  const [newActDuration, setNewActDuration] = React.useState("1.5h")

  // Inline Edit Form State
  const [editingActId, setEditingActId] = React.useState<string | null>(null)
  const [editStartTime, setEditStartTime] = React.useState("10:00")
  const [editEndTime, setEditEndTime] = React.useState("11:30")
  const [editTitle, setEditTitle] = React.useState("")
  const [editDesc, setEditDesc] = React.useState("")
  const [editLoc, setEditLoc] = React.useState("")
  const [editCost, setEditCost] = React.useState("")
  const [editCat, setEditCat] = React.useState("Sightseeing")
  const [editDuration, setEditDuration] = React.useState("1.5h")

  // AI Suggest Activity State
  const [isSuggesting, setIsSuggesting] = React.useState(false)

  // Simplified UI Toggles
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [isBudgetExpanded, setIsBudgetExpanded] = React.useState(false)
  const [showMoreAddFields, setShowMoreAddFields] = React.useState(false)
  const [showMoreEditFields, setShowMoreEditFields] = React.useState(false)

  // Interactive Trip Financial Calculator State
  const [isCalcOpen, setIsCalcOpen] = React.useState(false)
  const [calcTargetMode, setCalcTargetMode] = React.useState<"activity_new" | "activity_edit" | "budget">("activity_new")

  // dnd-kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setDays((prev) =>
      prev.map((d) => {
        if (d.dayNumber !== activeDayNumber) return d
        const oldIndex = d.activities.findIndex((a) => a.id === active.id)
        const newIndex = d.activities.findIndex((a) => a.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return d

        return {
          ...d,
          activities: arrayMove(d.activities, oldIndex, newIndex),
        }
      })
    )
  }

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

  // Day Management Handlers
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
      if (prev === dayNum) return Math.max(1, dayNum - 1)
      if (prev > dayNum) return prev - 1
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

  // Quick-Add Natural Language Handler
  const handleQuickAddActivity = (parsed: ParsedActivity) => {
    const cleanCost = parsed.estimatedCost ? parsed.estimatedCost.replace(/[^0-9.]/g, "") : ""
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      time: `${parsed.startTime} — ${parsed.endTime}`,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      title: parsed.title,
      description: parsed.description || "",
      location: parsed.location || "",
      duration: parsed.duration || "1.5h",
      estimatedCost: cleanCost ? cleanCost : "Free",
      category: parsed.category,
      bookingStatus: "wishlist",
    }

    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDayNumber ? { ...d, activities: [...d.activities, newAct] } : d
      )
    )

    toast({
      title: "⚡ Quick Added",
      description: `"${newAct.title}" added to Day ${activeDayNumber}.`,
    })
  }

  // Apply Day Template Handler
  const handleApplyDayTemplate = (template: DayTemplate) => {
    const newActivities: ActivityItem[] = template.activities.map((tAct, idx) => ({
      id: `act-${Date.now()}-${idx}`,
      time: `${tAct.startTime} — ${tAct.endTime}`,
      startTime: tAct.startTime,
      endTime: tAct.endTime,
      title: tAct.title,
      description: tAct.description || "",
      location: tAct.location || destination,
      duration: tAct.duration,
      estimatedCost: tAct.estimatedCost,
      category: tAct.category,
      bookingStatus: "wishlist",
    }))

    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDayNumber
          ? {
              ...d,
              title: template.name,
              activities: [...d.activities, ...newActivities],
            }
          : d
      )
    )

    toast({
      title: `Template Applied: ${template.name}`,
      description: `Added ${template.activities.length} curated stops to Day ${activeDayNumber}.`,
    })
  }

  // Apply Quick Stamp Handler
  const handleApplyQuickStamp = (stamp: QuickStamp) => {
    const sTime = defaultStartTime
    const eTime = calculateEndTimeFromDuration(sTime, stamp.duration)
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      time: `${sTime} — ${eTime}`,
      startTime: sTime,
      endTime: eTime,
      title: stamp.title,
      description: "",
      location: destination,
      duration: stamp.duration,
      estimatedCost: stamp.defaultCost,
      category: stamp.category,
      bookingStatus: "wishlist",
    }

    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDayNumber ? { ...d, activities: [...d.activities, newAct] } : d
      )
    )

    toast({
      title: `${stamp.icon} Stamp Added`,
      description: `"${stamp.title}" added to Day ${activeDayNumber}.`,
    })
  }

  // Move Activity between Days
  const handleMoveActivityToDay = (activityId: string, targetDayNumber: number) => {
    if (targetDayNumber === activeDayNumber) return
    let movingAct: ActivityItem | null = null

    setDays((prev) => {
      const fromDay = prev.find((d) => d.dayNumber === activeDayNumber)
      if (!fromDay) return prev
      movingAct = fromDay.activities.find((a) => a.id === activityId) || null
      if (!movingAct) return prev

      return prev.map((d) => {
        if (d.dayNumber === activeDayNumber) {
          return { ...d, activities: d.activities.filter((a) => a.id !== activityId) }
        }
        if (d.dayNumber === targetDayNumber) {
          return { ...d, activities: [...d.activities, movingAct!] }
        }
        return d
      })
    })

    if (movingAct) {
      toast({
        title: "Moved Activity",
        description: `Moved "${(movingAct as ActivityItem).title}" to Day ${targetDayNumber}.`,
      })
    }
  }

  // Booking Status Cycle: Wishlist -> Reserved -> Booked
  const handleToggleBooking = (id: string, nextStatus: "wishlist" | "reserved" | "booked") => {
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        activities: d.activities.map((a) =>
          a.id === id ? { ...a, bookingStatus: nextStatus, isBooked: nextStatus === "booked" } : a
        ),
      }))
    )
  }

  // Route Optimization (TSP 2-Opt)
  const handleOptimizeRoute = (optimizedActivities: ActivityItem[]) => {
    let currentStart = activeDay.activities[0]?.startTime || "09:00"
    const reChained = optimizedActivities.map((act) => {
      const dur = act.duration || "1.5h"
      const end = calculateEndTimeFromDuration(currentStart, dur)
      const updated: ActivityItem = {
        ...act,
        startTime: currentStart,
        endTime: end,
        time: `${currentStart} — ${end}`,
      }
      currentStart = end
      return updated
    })

    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDayNumber ? { ...d, activities: reChained } : d
      )
    )
  }

  // Calendar .ics Export Handler
  const handleExportCalendar = () => {
    exportToICalendar(tripTitle, destination, startDate, days)
    toast({
      title: "📅 Calendar (.ics) Exported",
      description: "Downloaded itinerary for Apple, Google, and Outlook Calendars.",
    })
  }

  // Bucket List Scratchpad Handlers
  const handleAddStagedItem = (item: StagedItem) => {
    setStagedItems((prev) => [item, ...prev])
    toast({
      title: "Saved to Bucket List",
      description: `"${item.title}" staged in your scratchpad tray.`,
    })
  }

  const handleRemoveStagedItem = (id: string) => {
    setStagedItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleMoveStagedToDay = (item: StagedItem, targetDayNumber: number) => {
    const sTime = defaultStartTime
    const dur = "1.5h"
    const eTime = calculateEndTimeFromDuration(sTime, dur)
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      time: `${sTime} — ${eTime}`,
      startTime: sTime,
      endTime: eTime,
      title: item.title,
      description: item.notes || "",
      location: item.location || destination,
      duration: dur,
      estimatedCost: item.estimatedCost || "Free",
      category: item.category || "Sightseeing",
      bookingStatus: "wishlist",
    }

    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === targetDayNumber
          ? { ...d, activities: [...d.activities, newAct] }
          : d
      )
    )

    handleRemoveStagedItem(item.id)
    toast({
      title: `Moved to Day ${targetDayNumber}`,
      description: `"${item.title}" placed on Day ${targetDayNumber} itinerary.`,
    })
  }

  // Detailed Modal Activity Form Handlers
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
      bookingStatus: "wishlist",
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
    setNewActStartTime(newActivity.endTime || "12:00")
    setNewActEndTime(calculateEndTimeFromDuration(newActivity.endTime || "12:00", "1.5h"))
    setIsAddingActivity(false)
    setShowMoreAddFields(false)

    toast({
      title: "Experience Saved",
      description: `"${newActivity.title}" added to Day ${activeDayNumber}.`,
    })
  }

  const handleStartEdit = (act: ActivityItem) => {
    setEditingActId(act.id)

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

  // AI Suggest Stop
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
        const sTime = data.activity.startTime || data.activity.time || defaultStartTime
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
          bookingStatus: "wishlist",
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

  // Copy Dossier
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
          if (a.bookingStatus) text += `    Booking: ${a.bookingStatus.toUpperCase()}\n`
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
    const coverImage =
      DESTINATIONS.find(
        (d) =>
          d.name.toLowerCase() === destination.toLowerCase() ||
          destination.toLowerCase().includes(d.name.toLowerCase())
      )?.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80"

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
      coordinates: destinationCenter,
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
          bookingStatus: a.bookingStatus,
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

  // Header quick action aliases
  const openTripDetails = () => setIsSettingsOpen((prev) => !prev)
  const handleCopy = handleCopyItinerary
  const handleSave = handleSaveTrip
  const toggleBucketList = () => setIsScratchpadOpen((prev) => !prev)
  const toggleMap = () => setIsMapOpen((prev) => !prev)
  const showMap = isMapOpen
  const handleExportICS = handleExportCalendar
  const dateRangeText = `${formatDisplayDate(startDate)} — ${formatDisplayDate(computedEndDate)} (${days.length} Days)`

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24 px-3 sm:px-0">
      {/* ─── 1. TOP HEADER & STUDIO QUICK CONTROLS ───────────────────────── */}
      <div className="glass-shell p-5 sm:p-6 rounded-3xl border border-white/15 shadow-2xl flex flex-col gap-4">
        {/* TOP ROW: Title, Tag, and Primary Save/Details Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          {/* Left: Title & Metadata */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="editorial-tag text-[#e8d5b5] text-xs uppercase tracking-wider font-semibold">
                Trip Planner
              </span>
              {hasAutoSaved && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 glass-pill px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-saved
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-white truncate max-w-xl">
                {tripTitle || "Custom Mediterranean Getaway"}
              </h1>
              <button
                onClick={openTripDetails}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#38bdf8] hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                title="Edit Trip Details"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                {destination || "Amalfi Coast, Italy"}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                {dateRangeText || "Sep 10 — Sep 11 (2 Days)"}
              </span>
            </div>
          </div>

          {/* Top Right: Core Journey Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={openTripDetails}
              className="px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-slate-200 hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Trip Details
            </button>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-slate-200 hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-[#e8d5b5] text-slate-900 font-medium text-xs hover:bg-[#dfcaa7] transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Save Journey
            </button>
          </div>
        </div>

        {/* BOTTOM ROW: Currency Switcher & Utility Tools */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Currency Toggle */}
          <div className="flex items-center gap-1 glass-pill p-1 rounded-xl bg-white/5 border border-white/10">
            {["USD", "INR", "EUR", "JPY"].map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr as CurrencyCode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  currency === curr
                    ? "bg-white/20 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {curr === "INR" ? "₹ INR" : curr === "EUR" ? "€ EUR" : curr === "JPY" ? "¥ JPY" : "$ USD"}
              </button>
            ))}
          </div>

          {/* Utility Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleBucketList}
              className="px-3 py-1.5 rounded-xl border border-white/15 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Bucket List</span>
              {stagedItems.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-bold flex items-center justify-center">
                  {stagedItems.length}
                </span>
              )}
            </button>
            <button
              onClick={toggleMap}
              className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs cursor-pointer ${
                showMap
                  ? "border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]"
                  : "border-white/15 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {showMap ? "Hide Map" : "Show Map"}
            </button>
            <button
              onClick={handleExportICS}
              className="px-3 py-1.5 rounded-xl border border-white/15 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export .ics
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. COLLAPSIBLE TRIP DETAILS ─────────────────────────────────── */}
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

      {/* ─── 5. INTERACTIVE MAP & ROUTE OPTIMIZER PANEL (When Opened) ─────── */}
      {isMapOpen && (
        <PlannerMapPanel
          dayNumber={activeDay.dayNumber}
          dayTitle={activeDay.title}
          activities={activeDay.activities}
          destinationCenter={destinationCenter}
          onOptimizeRoute={handleOptimizeRoute}
          onClose={() => setIsMapOpen(false)}
        />
      )}

      {/* ─── 6. ACTIVE DAY WORKSPACE ───────────────────────────────────────── */}
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
                <span>Form Entry</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── QUICK-ADD NATURAL LANGUAGE BAR & DAY PRESETS ─────────────────── */}
        <QuickAddBar
          dayNumber={activeDay.dayNumber}
          defaultStartTime={defaultStartTime}
          currencySymbol={currentCurrency.symbol}
          onAddActivity={handleQuickAddActivity}
          onApplyTemplate={handleApplyDayTemplate}
          onApplyStamp={handleApplyQuickStamp}
        />

        {/* ─── DETAILED ADD ACTIVITY FORM (Optional Full Modal/Inline) ─────── */}
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

        {/* ─── DRAG-AND-DROP SORTABLE ACTIVITIES TIMELINE ─────────────────── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeDay.activities.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
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
                  <SortableActivityCard
                    key={act.id}
                    activity={act}
                    index={actIdx}
                    allDayNumbers={allDayNumbers}
                    currentDayNumber={activeDay.dayNumber}
                    currencySymbol={currentCurrency.symbol}
                    transitToNext={transitEstimates[actIdx]}
                    onDelete={handleDeleteActivity}
                    onEdit={handleStartEdit}
                    onToggleBooking={handleToggleBooking}
                    onMoveToDay={handleMoveActivityToDay}
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
                      + Form Entry
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* ─── 7. BUCKET LIST / SCRATCHPAD TRAY DRAWER ─────────────────────── */}
      <ScratchpadTray
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        stagedItems={stagedItems}
        activeDayNumber={activeDay.dayNumber}
        allDayNumbers={allDayNumbers}
        currencySymbol={currentCurrency.symbol}
        onAddItem={handleAddStagedItem}
        onRemoveItem={handleRemoveStagedItem}
        onMoveToDay={handleMoveStagedToDay}
      />

      {/* ─── 8. INTERACTIVE TRIP FINANCIAL CALCULATOR MODAL ───────────────── */}
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
