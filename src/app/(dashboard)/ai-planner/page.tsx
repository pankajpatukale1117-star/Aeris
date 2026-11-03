"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Sparkles,
  MapPin,
  Calendar,
  Compass,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Send,
  MessageSquare,
  BookmarkPlus,
  RefreshCw,
  Lightbulb,
  DollarSign,
  KeyRound,
  ShieldCheck,
  Clock,
  Navigation,
  Check,
  Sliders,
  ChevronRight,
  Star,
  Mic,
  Copy,
  Layers,
  Share2,
  PieChart,
  User,
  Bot,
  RotateCcw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTravelStore, StoredTrip } from "@/lib/store/travel-store"
import { useGeminiStore } from "@/lib/gemini-store"
import { DESTINATIONS } from "@/lib/constants"
import { SynthesizedItinerary } from "@/app/api/synthesize/route"
import { BudgetDoughnutChart } from "@/components/analytics/budget-doughnut-chart"

type CurrencyCode = "USD" | "INR" | "EUR" | "JPY"

const CURRENCIES: Array<{ code: CurrencyCode; symbol: string; rate: number; label: string }> = [
  { code: "USD", symbol: "$", rate: 1, label: "USD ($)" },
  { code: "INR", symbol: "₹", rate: 85, label: "INR (₹)" },
  { code: "EUR", symbol: "€", rate: 0.92, label: "EUR (€)" },
  { code: "JPY", symbol: "¥", rate: 155, label: "JPY (¥)" },
]

const CURATORIAL_LENSES = [
  { id: "Architectural & Cultural Gems", label: "Architectural & Cultural Gems", icon: "🏛️" },
  { id: "Gastronomy & Hidden Salons", label: "Gastronomy & Hidden Salons", icon: "🍷" },
  { id: "Coastal & Nature Sanctuary", label: "Coastal & Nature Sanctuary", icon: "🌊" },
  { id: "Private Concierge Luxury", label: "Private Concierge Luxury", icon: "✨" },
]

const PACE_MODES = [
  { id: "Slow & Zen", label: "Slow & Zen", desc: "1—2 deep experiences with contemplative afternoons." },
  { id: "Balanced", label: "Balanced", desc: "Harmonious circadian rhythm with breathing room." },
  { id: "High Pulse", label: "High Pulse", desc: "Dynamic multi-neighborhood immersion." },
]

const QUICK_SANCTUARIES = [
  "Kolhapur, India",
  "Kyoto, Japan",
  "Zermatt, Switzerland",
  "Amalfi Coast, Italy",
  "Santorini, Greece",
  "Hallstatt, Austria",
]

const QUICK_PROMPT_CHIPS = [
  {
    label: "📍 4 Days in Kolhapur & Panhala fort",
    query: "Plan 4 days in Kolhapur exploring historic temples, Panhala fort, and authentic food",
    dest: "Kolhapur, Maharashtra, India",
    days: 4,
  },
  {
    label: "🚶 Adjust day 2 with less walking for parents",
    query: "Actually, my parents can't walk long distances, adjust day 2 with less walking",
    isModification: true,
  },
  {
    label: "🍲 Add traditional Kolhapuri mutton thali dinner",
    query: "Add a traditional Kolhapuri mutton thali spot for dinner",
    isModification: true,
  },
  {
    label: "💵 Make the whole trip budget-friendly under $100/day",
    query: "Can we make the whole trip budget-friendly under $100 a day?",
    isModification: true,
  },
  {
    label: "🍋 5 Days in Amalfi & Capri with private boat",
    query: "Plan 5 days in Amalfi Coast and Capri with a private boat charter and cliffside dining",
    dest: "Amalfi Coast, Italy",
    days: 5,
  },
  {
    label: "⛩️ Slow-paced Zen retreat in Kyoto temples",
    query: "Plan a slow-paced 4-day Zen retreat in Kyoto exploring secluded bamboo groves and tea ceremonies",
    dest: "Kyoto, Japan",
    days: 4,
  },
]

interface ConversationMessage {
  id: string
  role: "user" | "ai"
  text: string
  timestamp: string
}

function AIPlannerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const addTrip = useTravelStore((state) => state.addTrip)
  const { apiKey, hasKey, openModal } = useGeminiStore()

  const prefillDestination = searchParams.get("destination") || ""

  // Core Expedition Form Controls
  const [destination, setDestination] = React.useState(prefillDestination || "Kolhapur, Maharashtra")
  const [days, setDays] = React.useState(3)
  const [pace, setPace] = React.useState("Balanced")
  const [lens, setLens] = React.useState("Architectural & Cultural Gems")
  const [currency, setCurrency] = React.useState<CurrencyCode>("USD")

  // Multi-Turn Conversational Memory State
  const [conversationalInput, setConversationalInput] = React.useState("")
  const [conversationHistory, setConversationHistory] = React.useState<ConversationMessage[]>([
    {
      id: "welcome-1",
      role: "ai",
      text: "Greetings. I am ROVEO's Multi-Turn Concierge Engine. Request any expedition on Earth in natural prose, or ask me to modify an existing itinerary on the fly (e.g. reduce walking for family, add authentic dining, or adjust daily budgets).",
      timestamp: "Just now",
    },
  ])

  // Active Itinerary State
  const [itinerary, setItinerary] = React.useState<SynthesizedItinerary | null>(null)
  const [selectedDay, setSelectedDay] = React.useState(1)
  const [sourceModel, setSourceModel] = React.useState<string>("")

  // Ultra-Smooth Multi-Stage Loading Transitions State
  const [loading, setLoading] = React.useState(false)
  const [loadingStage, setLoadingStage] = React.useState(1)
  const [progressPercent, setProgressPercent] = React.useState(15)

  const chatContainerRef = React.useRef<HTMLDivElement | null>(null)

  // Scroll chat to bottom on new messages
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [conversationHistory, loading])

  // Handle URL prefill destination
  React.useEffect(() => {
    if (prefillDestination) {
      setDestination(prefillDestination)
    }
  }, [prefillDestination])

  // Multi-Stage animated progress ticker
  React.useEffect(() => {
    let t1: NodeJS.Timeout
    let t2: NodeJS.Timeout
    let t3: NodeJS.Timeout

    if (loading) {
      setLoadingStage(1)
      setProgressPercent(24)

      t1 = setTimeout(() => {
        setLoadingStage(2)
        setProgressPercent(64)
      }, 950)

      t2 = setTimeout(() => {
        setLoadingStage(3)
        setProgressPercent(89)
      }, 2100)

      t3 = setTimeout(() => {
        setProgressPercent(97)
      }, 3400)
    }

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [loading])

  // Currency Converter Helpers
  const activeCurrencyConfig = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]
  const convertAmount = (usdAmount: number) => Math.round(usdAmount * activeCurrencyConfig.rate)

  // Core Multi-Turn Synthesize / Mutate Executor
  const executeMultiTurnQuery = async (params: {
    queryText: string
    overrideDest?: string
    overrideDays?: number
    overridePace?: string
    overrideLens?: string
  }) => {
    const { queryText, overrideDest, overrideDays, overridePace, overrideLens } = params
    if (!queryText.trim() || loading) return

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    // 1. Immediately append user message to multi-turn conversation memory
    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: queryText,
      timestamp: nowTime,
    }

    const updatedHistory = [...conversationHistory, userMsg]
    setConversationHistory(updatedHistory)
    setConversationalInput("")
    setLoading(true)

    const targetDest = overrideDest || destination
    const targetDays = overrideDays || days
    const targetPace = overridePace || pace
    const targetLens = overrideLens || lens

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": apiKey || "",
        },
        body: JSON.stringify({
          prompt: queryText,
          message: queryText,
          destination: targetDest,
          days: targetDays,
          pace: targetPace,
          lens: targetLens,
          currency,
          apiKey,
          currentItinerary: itinerary,
          history: updatedHistory.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            text: m.text,
          })),
        }),
      })

      const data = await res.json()
      if (data.itinerary) {
        setItinerary(data.itinerary)
        setSourceModel(data.source || (hasKey ? "gemini-2.5-flash" : "curated-sanctuary"))
        setSelectedDay(1)
        if (data.itinerary.name) setDestination(data.itinerary.name)
        if (data.itinerary.days?.length) setDays(data.itinerary.days.length)

        // 2. Append AI Concierge response to conversation history
        const aiReply = data.itinerary.chatReply || `I have updated your circadian flow for ${data.itinerary.name}.`
        setConversationHistory((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "ai",
            text: aiReply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ])

        toast({
          title: itinerary ? "Itinerary Mutated" : "Itinerary Synthesized",
          description: `Circadian blueprint for ${data.itinerary.name} updated.`,
        })
      } else {
        throw new Error(data.error || "Synthesis failed")
      }
    } catch (err: any) {
      console.warn("Client synthesis notice:", err)
      toast({
        title: "Synthesis Notice",
        description: "Engaging ROVEO High-Fidelity Universal Curated Engine.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle Form Submit from Left Studio Controls
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    executeMultiTurnQuery({
      queryText: `Curate a ${days}-day circadian travel blueprint for ${destination} focusing on ${lens} at a ${pace} pace.`,
      overrideDest: destination,
      overrideDays: days,
      overridePace: pace,
      overrideLens: lens,
    })
  }

  // Handle Conversational AI Chat Box Submit
  const handleChatSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    executeMultiTurnQuery({ queryText: conversationalInput.trim() })
  }

  // Handle 1-Click Quick Prompt Chips
  const handleChipClick = (chip: typeof QUICK_PROMPT_CHIPS[0]) => {
    if (chip.dest) setDestination(chip.dest)
    if (chip.days) setDays(chip.days)
    executeMultiTurnQuery({
      queryText: chip.query,
      overrideDest: chip.dest,
      overrideDays: chip.days,
    })
  }

  // Reset Conversation
  const handleResetChat = () => {
    setConversationHistory([
      {
        id: `welcome-${Date.now()}`,
        role: "ai",
        text: "Conversation refreshed. Tell me where you wish to explore next, or what specific experience you desire.",
        timestamp: "Just now",
      },
    ])
    toast({
      title: "Chat Thread Reset",
      description: "Started fresh conversational memory.",
    })
  }

  // Save Trip to Local Travel Store
  const handleSaveTrip = () => {
    if (!itinerary) return

    const matchedDest = DESTINATIONS.find(
      (d) =>
        d.name.toLowerCase() === itinerary.name.toLowerCase() ||
        destination.toLowerCase().includes(d.name.toLowerCase())
    )

    const newTrip: StoredTrip = {
      id: `trip-${Date.now()}`,
      title: `${itinerary.name} — ${lens.split("&")[0].trim()} Expedition`,
      destination: itinerary.region || destination,
      dates: `${itinerary.duration} • ${itinerary.season || "Curated Season"}`,
      travelers: 2,
      coverImage:
        matchedDest?.image ||
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80",
      status: "upcoming",
      planningMode: "AI Architecture",
      daysCount: itinerary.days.length,
      budget: `${activeCurrencyConfig.symbol}${convertAmount(itinerary.budgetMin)} — ${activeCurrencyConfig.symbol}${convertAmount(itinerary.budgetMax)} / day`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      days: itinerary.days.map((d) => ({
        dayNumber: d.day,
        date: `Day ${d.day}`,
        title: d.theme,
        description: `${d.stops.length} curated stops across ${itinerary.name}.`,
        activities: d.stops.map((s, idx) => ({
          id: `act-${d.day}-${idx + 1}`,
          time: s.slot.split("•")[1]?.trim() || "09:00",
          title: s.title,
          description: `${s.note} (${s.dist})`,
          duration: "2.5h",
          location: s.dist,
          estimatedCost: s.reserved ? `${activeCurrencyConfig.symbol}${convertAmount(75)}` : "Complimentary",
          category: idx === 0 ? "Cultural" : idx === 1 ? "Food" : "Relaxation",
        })),
      })),
    }

    addTrip(newTrip)
    toast({
      title: "Journey Bookmarked",
      description: `Saved "${newTrip.title}" to your Travel Desk.`,
    })
    router.push(`/trips/${newTrip.id}`)
  }

  // Copy Itinerary Text
  const handleCopyItinerary = () => {
    if (!itinerary) return
    const textSummary = `ROVEO Bespoke Itinerary: ${itinerary.name} (${itinerary.region})\nDuration: ${itinerary.duration}\nSeason: ${itinerary.season}\nEstimated Daily Cadence: ${activeCurrencyConfig.symbol}${convertAmount(itinerary.dailyCost)} / day\n\n${itinerary.description}\n\nHighlights:\n${itinerary.highlights.map((h) => `• ${h}`).join("\n")}\n\nCircadian Timeline:\n${itinerary.days.map((d) => `Day ${d.day} — ${d.theme}:\n${d.stops.map((s) => `  ${s.slot}: ${s.title} (${s.note} • ${s.dist})`).join("\n")}`).join("\n\n")}`
    navigator.clipboard.writeText(textSummary)
    toast({
      title: "Copied to Clipboard",
      description: "Complete itinerary blueprint copied.",
    })
  }

  return (
    <div className="space-y-8 animate-reveal max-w-7xl mx-auto pb-24">
      {/* ─── Studio Top Header & Telemetry ─────────────────────────────────── */}
      <div className="glass-shell p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#38bdf8]/15 via-[#e8d5b5]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 glass-pill px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#e8d5b5]">
            <Sparkles className="w-3 h-3 text-[#38bdf8]" />
            Multi-Turn Gemini Travel Concierge
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-medium tracking-tight text-[#f1f5f9]">
            ROVEO <span className="italic text-[#e8d5b5]">Concierge Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-light">
            Your journey, your way. Chat naturally to generate or adapt live itineraries for any village, town, or metropolis on Earth.
          </p>
        </div>

        {/* Currency & API Settings Controls */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* Currency Switcher */}
          <div className="flex items-center glass-pill rounded-full p-1 border border-white/10">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                  currency === c.code
                    ? "bg-[#e8d5b5] text-[#050a10] shadow-[0_0_10px_rgba(232,213,181,0.4)]"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {c.symbol} {c.code}
              </button>
            ))}
          </div>

          {/* Gemini Key Pill */}
          <button
            onClick={openModal}
            className="glass-pill px-3.5 py-2 text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                hasKey ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400"
              }`}
            />
            <span>{hasKey ? "Gemini 2.5 Active" : "Settings"}</span>
          </button>

          <Link
            href="/destinations"
            className="glass-pill px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1.5 transition-all hover:border-[#38bdf8]/50"
          >
            <Compass className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Atlas</span>
          </Link>
        </div>
      </div>

      {/* ─── 1. REAL MULTI-TURN CONVERSATIONAL AI CHAT STUDIO (PROMINENT HERO) ─ */}
      <div className="glass-shell rounded-3xl p-5 sm:p-7 border border-white/15 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#e8d5b5]/10 via-[#38bdf8]/10 to-transparent blur-3xl pointer-events-none" />

        {/* Chat Studio Bar Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[#e8d5b5] shadow-[0_0_12px_rgba(232,213,181,0.3)]">
              <Bot className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <span>Multi-Turn Conversational Memory</span>
                <span className="text-[10px] font-normal uppercase tracking-widest text-[#e8d5b5] glass-pill px-2 py-0.5 rounded-full">
                  Live Itinerary Mutation
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-light">
                Chat naturally to adjust pacing, swap stops, reduce walking, or alter budgets on the fly.
              </p>
            </div>
          </div>

          <button
            onClick={handleResetChat}
            className="text-[11px] glass-pill px-3 py-1.5 rounded-full text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reset Chat Memory"
          >
            <RotateCcw className="w-3 h-3 text-[#38bdf8]" />
            <span className="hidden sm:inline">New Thread</span>
          </button>
        </div>

        {/* Liquid Glass Multi-Turn Chat Thread */}
        <div
          ref={chatContainerRef}
          className="space-y-3 max-h-72 sm:max-h-80 overflow-y-auto pr-1 relative z-10 scrollbar-none pt-1"
        >
          {conversationHistory.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-2xl text-xs leading-relaxed transition-all relative ${
                msg.role === "user"
                  ? "bg-[#38bdf8]/15 text-white ml-auto max-w-xl border border-[#38bdf8]/35 shadow-md"
                  : "glass-card text-slate-100 mr-auto max-w-2xl border-white/15 border-l-4 border-l-[#e8d5b5] shadow-lg"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold mb-1 opacity-75">
                <div className="flex items-center gap-1.5">
                  {msg.role === "user" ? (
                    <>
                      <User className="w-3 h-3 text-[#38bdf8]" />
                      <span>You</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-[#e8d5b5]" />
                      <span className="text-[#e8d5b5]">ROVEO Concierge</span>
                    </>
                  )}
                </div>
                <span className="text-slate-400 font-mono text-[9px]">{msg.timestamp}</span>
              </div>
              <p className="font-light text-slate-200 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line">
                {msg.text}
              </p>
            </div>
          ))}

          {/* Live Typing & Shimmer Indicator while Generating */}
          {loading && (
            <div className="glass-card p-4 rounded-2xl mr-auto max-w-md border-white/15 border-l-4 border-l-[#38bdf8] space-y-2 animate-reveal">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#38bdf8]">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>Concierge is synthesizing...</span>
              </div>
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-[#e8d5b5] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#34d399] animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="text-[11px] text-slate-300 font-light ml-2">
                  {loadingStage === 1 && "Geocoding authentic local spots..."}
                  {loadingStage === 2 && "Calibrating circadian flow..."}
                  {loadingStage === 3 && "Finalizing notes & budget telemetry..."}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Responsive Multi-Turn Natural Language Input Bar */}
        <form onSubmit={handleChatSubmit} className="relative z-10 pt-1">
          <div className="relative flex items-center">
            <div className="absolute left-4 flex items-center gap-2 text-slate-400">
              <span title="Natural Voice Concierge Prompt">
                <Mic className="w-4 h-4 text-[#e8d5b5] hover:text-white transition-colors cursor-pointer" />
              </span>
              <div className="w-[1px] h-4 bg-white/20 hidden sm:block" />
            </div>

            <input
              type="text"
              placeholder='Chat naturally: "Adjust day 2 with less walking for parents", "Add a traditional Kolhapuri mutton thali dinner", "Make it under $100/day"...'
              value={conversationalInput}
              onChange={(e) => setConversationalInput(e.target.value)}
              disabled={loading}
              className="glass-input w-full pl-12 sm:pl-14 pr-28 sm:pr-36 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading || !conversationalInput.trim()}
              className="btn-luxe absolute right-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#050a10]" />
                  <span className="hidden sm:inline">Mutating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-[#050a10]" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick-Prompt Interactive Suggestion Chips */}
        <div className="space-y-1.5 relative z-10 pt-1">
          <div className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3 text-[#38bdf8]" />
            <span>Multi-Turn Prompts (Click to mutate live)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip)}
                disabled={loading}
                className="text-xs glass-pill px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:border-[#e8d5b5]/50 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN TWO-COLUMN STUDIO LAYOUT ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Fine-Tuning Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleFormSubmit} className="glass-shell p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-[#38bdf8]" />
                <span>Expedition Parameters</span>
              </div>
              <span className="text-[10px] text-[#e8d5b5] font-mono">Bespoke Flow</span>
            </div>

            {/* Target Location */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium pl-1 flex items-center justify-between">
                <span>Target City, Town or Village</span>
                <span className="text-slate-400 font-light">Universal</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Kolhapur, Zermatt, Amalfi Coast, Kyoto"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  required
                />
              </div>

              {/* Quick Sanctuary Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_SANCTUARIES.map((sanctuary) => (
                  <button
                    key={sanctuary}
                    type="button"
                    onClick={() => setDestination(sanctuary)}
                    className="text-[10px] glass-pill px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:border-[#38bdf8]/40 transition-colors cursor-pointer"
                  >
                    {sanctuary.split(",")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium">
                  Expedition Duration
                </label>
                <span className="text-xs font-semibold text-[#38bdf8] font-mono">
                  {days} Days
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="14"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full accent-[#38bdf8] h-2 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 px-1">
                <span>Weekend (2d)</span>
                <span>Week (7d)</span>
                <span>Fortnight (14d)</span>
              </div>
            </div>

            {/* Circadian Pace */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium pl-1">
                Circadian Pace & Energy
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PACE_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPace(mode.id)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      pace === mode.id
                        ? "bg-[#e8d5b5]/15 border-[#e8d5b5] text-white shadow-[0_0_15px_rgba(232,213,181,0.2)]"
                        : "glass-pill text-slate-300 hover:text-white border-white/10"
                    }`}
                  >
                    <div className="text-xs font-medium">{mode.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Curatorial Lens */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium pl-1">
                Curatorial Lens
              </label>
              <div className="space-y-2">
                {CURATORIAL_LENSES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLens(l.id)}
                    className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      lens === l.id
                        ? "bg-[#38bdf8]/15 border-[#38bdf8] text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                        : "glass-pill text-slate-300 hover:text-white border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{l.icon}</span>
                      <span className="text-xs font-medium">{l.label}</span>
                    </div>
                    {lens === l.id && <Check className="w-3.5 h-3.5 text-[#38bdf8]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-luxe w-full py-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#050a10]" />
                  <span>Synthesizing Bespoke Flow...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#050a10]" />
                  <span>Synthesize Bespoke Flow</span>
                </>
              )}
            </button>
          </form>

          {/* Live Chart.js Budget Telemetry Doughnut Chart */}
          {itinerary && (
            <BudgetDoughnutChart
              costBreakdown={itinerary.costBreakdown}
              dailyCost={convertAmount(itinerary.dailyCost)}
              budgetMin={convertAmount(itinerary.budgetMin)}
              budgetMax={convertAmount(itinerary.budgetMax)}
              currency={currency}
              currencySymbol={activeCurrencyConfig.symbol}
            />
          )}
        </div>

        {/* Right Column: Synthesized Editorial Itinerary or Multi-Stage Skeleton (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* ─── 3. MULTI-STAGE LOADING TRANSITIONS (3-STAGE ANIMATED TICKER) ── */}
          {loading ? (
            <div className="space-y-6 animate-reveal">
              {/* Animated Liquid Glass Stage Ticker */}
              <div className="glass-shell rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative overflow-hidden space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full glass-pill flex items-center justify-center text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.4)]">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-[#38bdf8]" />
                    </div>
                    <span className="text-xs font-semibold text-white tracking-wide">
                      Mutating Circadian Blueprint
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#e8d5b5]">
                    {progressPercent}%
                  </span>
                </div>

                {/* Shimmering Progress Bar */}
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] via-[#e8d5b5] to-[#34d399] transition-all duration-700 ease-out shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                  />
                </div>

                {/* 3-Stage Progress Descriptions */}
                <div className="space-y-2.5 pt-2">
                  <div
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-xl transition-all ${
                      loadingStage >= 1
                        ? "text-white bg-white/[0.06] border border-white/10"
                        : "text-slate-500 opacity-40"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${loadingStage >= 1 ? "bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" : "bg-slate-600"}`} />
                    <span className="font-medium">Stage 1 (0–30%):</span>
                    <span className="font-light">📍 Geocoding authentic local spots & walking corridors...</span>
                  </div>

                  <div
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-xl transition-all ${
                      loadingStage >= 2
                        ? "text-white bg-white/[0.06] border border-white/10"
                        : "text-slate-500 opacity-40"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${loadingStage >= 2 ? "bg-[#e8d5b5] shadow-[0_0_8px_#e8d5b5]" : "bg-slate-600"}`} />
                    <span className="font-medium">Stage 2 (30–75%):</span>
                    <span className="font-light">🌙 Calibrating circadian flow from dawn light to twilight...</span>
                  </div>

                  <div
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-xl transition-all ${
                      loadingStage >= 3
                        ? "text-white bg-white/[0.06] border border-white/10"
                        : "text-slate-500 opacity-40"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${loadingStage >= 3 ? "bg-[#34d399] shadow-[0_0_8px_#34d399]" : "bg-slate-600"}`} />
                    <span className="font-medium">Stage 3 (75–100%):</span>
                    <span className="font-light">✨ Finalizing concierge notes & live cost telemetry...</span>
                  </div>
                </div>
              </div>

              {/* Shimmering Skeleton Wireframe */}
              <div className="glass-shell rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
                <div className="h-6 w-3/4 shimmer-skeleton rounded-xl" />
                <div className="h-4 w-1/2 shimmer-skeleton rounded-lg" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-16 shimmer-skeleton rounded-2xl" />
                  <div className="h-16 shimmer-skeleton rounded-2xl" />
                  <div className="h-16 shimmer-skeleton rounded-2xl" />
                </div>
                <div className="space-y-3 pt-3">
                  <div className="h-20 shimmer-skeleton rounded-2xl" />
                  <div className="h-20 shimmer-skeleton rounded-2xl" />
                  <div className="h-20 shimmer-skeleton rounded-2xl" />
                </div>
              </div>
            </div>
          ) : itinerary ? (
            /* ─── 4. SYNTHESIZED RESULTS PRESENTATION ──────────────────────── */
            <div className="space-y-6 animate-reveal">
              {/* Header Showcase Card */}
              <div className="glass-shell rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#38bdf8]/10 via-[#e8d5b5]/5 to-transparent blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#e8d5b5] font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>{itinerary.region}</span>
                      <span>•</span>
                      <span className="text-[#38bdf8]">{itinerary.duration}</span>
                    </div>
                    <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-white">
                      {itinerary.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyItinerary}
                      className="glass-pill px-3.5 py-2 rounded-full text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Copy Itinerary Text"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Copy</span>
                    </button>
                    <button
                      onClick={handleSaveTrip}
                      className="btn-luxe px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <BookmarkPlus className="w-4 h-4 text-[#050a10]" />
                      <span>Save Journey</span>
                    </button>
                  </div>
                </div>

                {/* Editorial Prose Description */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
                  {itinerary.description}
                </p>

                {/* Telemetry Bar: Rating, Season, Cost */}
                <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="glass-card p-3 rounded-2xl">
                    <div className="text-[10px] uppercase text-slate-400 tracking-wider">Curatorial Rating</div>
                    <div className="text-sm font-semibold text-[#e8d5b5] flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{itinerary.rating} / 5.0</span>
                    </div>
                  </div>

                  <div className="glass-card p-3 rounded-2xl">
                    <div className="text-[10px] uppercase text-slate-400 tracking-wider">Ideal Season</div>
                    <div className="text-xs font-semibold text-white mt-1 truncate">
                      {itinerary.season}
                    </div>
                  </div>

                  <div className="glass-card p-3 rounded-2xl">
                    <div className="text-[10px] uppercase text-slate-400 tracking-wider">Est. Daily Cadence</div>
                    <div className="text-xs font-semibold text-[#38bdf8] mt-1 font-mono">
                      {activeCurrencyConfig.symbol}{convertAmount(itinerary.dailyCost)} / day
                    </div>
                  </div>
                </div>

                {/* Curated Highlights Chips */}
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium">
                    Curated Highlights
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {itinerary.highlights.map((h, i) => (
                      <div key={i} className="glass-pill px-3 py-2 rounded-xl text-xs text-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Day Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {itinerary.days.map((d) => (
                  <button
                    key={d.day}
                    onClick={() => setSelectedDay(d.day)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedDay === d.day
                        ? "bg-[#e8d5b5] text-[#050a10] shadow-[0_0_15px_rgba(232,213,181,0.4)]"
                        : "glass-pill text-slate-300 hover:text-white"
                    }`}
                  >
                    Day {d.day}
                  </button>
                ))}
              </div>

              {/* Selected Day Circadian Timeline */}
              {itinerary.days
                .filter((d) => d.day === selectedDay)
                .map((dayPlan) => (
                  <div key={dayPlan.day} className="space-y-4">
                    <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-[#e8d5b5]">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-semibold">
                          Day {dayPlan.day} Circadian Focus
                        </span>
                        <h4 className="font-editorial text-xl font-medium text-white">
                          {dayPlan.theme}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {dayPlan.stops.length} Circadian Stops
                      </span>
                    </div>

                    <div className="space-y-3">
                      {dayPlan.stops.map((stop, sIdx) => (
                        <div
                          key={sIdx}
                          className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 hover:border-[#38bdf8]/30 transition-all"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#38bdf8] font-mono font-medium flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {stop.slot}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">{stop.dist}</span>
                              {stop.reserved ? (
                                <span className="glass-pill px-2 py-0.5 rounded-full text-[9px] font-semibold text-emerald-400 border-emerald-500/30">
                                  Reserved Access
                                </span>
                              ) : (
                                <span className="glass-pill px-2 py-0.5 rounded-full text-[9px] text-slate-400">
                                  Walk-in Flow
                                </span>
                              )}
                            </div>
                          </div>

                          <h5 className="font-editorial text-lg text-white font-medium">
                            {stop.title}
                          </h5>

                          <p className="text-xs text-slate-300 font-light leading-relaxed">
                            {stop.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              {/* Concierge Departure Prep Checklist */}
              <div className="glass-shell p-6 rounded-3xl border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs text-[#e8d5b5] font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                  <span>Concierge Departure Checklist</span>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  {itinerary.prepList.map((prep, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#34d399] mt-0.5 shrink-0" />
                      <span>{prep}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ─── 5. EMPTY INVITATION STATE ───────────────────────────────── */
            <div className="glass-shell rounded-3xl p-10 sm:p-14 text-center space-y-6 border border-white/10 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl glass-pill flex items-center justify-center mx-auto text-[#e8d5b5] shadow-[0_0_20px_rgba(232,213,181,0.2)]">
                <Compass className="w-8 h-8 text-[#38bdf8]" />
              </div>
              <div className="space-y-2">
                <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-white">
                  Awaiting Your Sanctuary Coordinates
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Enter any global location into the Conversational Chat Studio above or click a prompt chip to synthesize your bespoke blueprint.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() =>
                    handleChipClick(QUICK_PROMPT_CHIPS[0])
                  }
                  className="btn-luxe px-6 py-3 rounded-full text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#050a10]" />
                  <span>Curate Kolhapur Preview</span>
                </button>

                <button
                  onClick={() =>
                    handleChipClick(QUICK_PROMPT_CHIPS[4])
                  }
                  className="glass-pill px-6 py-3 rounded-full text-xs font-medium text-slate-200 hover:text-white inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Curate Amalfi Preview</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AIPlannerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#38bdf8]" />
          <span>Opening AI Travel Concierge Studio...</span>
        </div>
      }
    >
      <AIPlannerContent />
    </React.Suspense>
  )
}