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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTravelStore, StoredTrip } from "@/lib/store/travel-store"
import { useGeminiStore } from "@/lib/gemini-store"
import { DESTINATIONS } from "@/lib/constants"
import { SynthesizedItinerary } from "@/app/api/synthesize/route"

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

const QUICK_PROMPT_PILLS = [
  {
    label: "📍 3 Days in Kolhapur & Western Ghats",
    query: "Plan a 3-day trip to Kolhapur exploring historic Mahalakshmi temple, Panhala fort, authentic Kolhapuri cuisine, and serene Western Ghats sunsets",
    dest: "Kolhapur, Maharashtra, India",
    days: 3,
    pace: "Balanced",
    lens: "Architectural & Cultural Gems",
  },
  {
    label: "🍋 5 Days in Amalfi & Capri with private boat",
    query: "Plan a 5-day escape along the Amalfi Coast and Capri featuring private coastal boat excursions, lemon grove terraces, and cliffside dining",
    dest: "Amalfi Coast, Italy",
    days: 5,
    pace: "Balanced",
    lens: "Coastal & Nature Sanctuary",
  },
  {
    label: "⛩️ Slow-paced Zen retreat in Kyoto temples",
    query: "Plan a slow-paced 4-day Zen retreat in Kyoto exploring secluded bamboo groves, tea ceremonies, morning meditation, and traditional temple architecture",
    dest: "Kyoto, Japan",
    days: 4,
    pace: "Slow & Zen",
    lens: "Architectural & Cultural Gems",
  },
  {
    label: "🏔️ Offbeat Alpine escape in Zermatt & Lauterbrunnen",
    query: "Plan an offbeat 5-day Alpine escape in Zermatt and Lauterbrunnen valley with panoramic glacier trails, secluded chalets, and mountain rail journeys",
    dest: "Zermatt, Switzerland",
    days: 5,
    pace: "Balanced",
    lens: "Coastal & Nature Sanctuary",
  },
]

function AIPlannerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const addTrip = useTravelStore((state) => state.addTrip)
  const { apiKey, hasKey, openModal } = useGeminiStore()

  const prefillDestination = searchParams.get("destination") || ""

  // Form State
  const [destination, setDestination] = React.useState(prefillDestination || "Kolhapur, Maharashtra")
  const [days, setDays] = React.useState(3)
  const [pace, setPace] = React.useState("Balanced")
  const [lens, setLens] = React.useState("Architectural & Cultural Gems")

  // Conversational AI Chat State
  const [conversationalInput, setConversationalInput] = React.useState("")
  const [chatHistory, setChatHistory] = React.useState<Array<{ role: "user" | "ai"; text: string }>>([])

  // Output & Loading State
  const [loading, setLoading] = React.useState(false)
  const [loadingStage, setLoadingStage] = React.useState(1)
  const [progressPercent, setProgressPercent] = React.useState(15)
  const [itinerary, setItinerary] = React.useState<SynthesizedItinerary | null>(null)
  const [selectedDay, setSelectedDay] = React.useState(1)
  const [sourceModel, setSourceModel] = React.useState<string>("")

  // Pre-load from query param if available
  React.useEffect(() => {
    if (prefillDestination) {
      setDestination(prefillDestination)
    }
  }, [prefillDestination])

  // Multi-stage loading progress ticker
  React.useEffect(() => {
    let t1: NodeJS.Timeout
    let t2: NodeJS.Timeout
    let t3: NodeJS.Timeout

    if (loading) {
      setLoadingStage(1)
      setProgressPercent(22)

      t1 = setTimeout(() => {
        setLoadingStage(2)
        setProgressPercent(60)
      }, 900)

      t2 = setTimeout(() => {
        setLoadingStage(3)
        setProgressPercent(88)
      }, 2100)

      t3 = setTimeout(() => {
        setProgressPercent(96)
      }, 3400)
    }

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [loading])

  // Core synthesis executor
  const executeSynthesis = async (params: {
    promptQuery: string
    targetDest?: string
    targetDays?: number
    targetPace?: string
    targetLens?: string
    isFollowUp?: boolean
  }) => {
    const { promptQuery, targetDest, targetDays, targetPace, targetLens, isFollowUp } = params
    setLoading(true)

    // Add query to chat history
    setChatHistory((prev) => [...prev, { role: "user", text: promptQuery }])

    const activeDest = targetDest || destination
    const activeDays = targetDays || days
    const activePace = targetPace || pace
    const activeLens = targetLens || lens

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": apiKey || "",
        },
        body: JSON.stringify({
          prompt: promptQuery,
          destination: activeDest,
          days: activeDays,
          pace: activePace,
          lens: activeLens,
          apiKey,
          context: isFollowUp && itinerary ? itinerary : undefined,
        }),
      })

      const data = await res.json()
      if (data.itinerary) {
        setItinerary(data.itinerary)
        setSourceModel(data.source || (hasKey ? "gemini-2.5-flash" : "curated-sanctuary"))
        setSelectedDay(1)
        if (targetDest) setDestination(targetDest)
        if (targetDays) setDays(targetDays)
        if (targetPace) setPace(targetPace)
        if (targetLens) setLens(targetLens)

        // Append AI response to chat history
        if (data.itinerary.chatReply) {
          setChatHistory((prev) => [
            ...prev,
            { role: "ai", text: data.itinerary.chatReply },
          ])
        }

        toast({
          title: isFollowUp ? "Itinerary Refined" : "Itinerary Synthesized",
          description: `Circadian blueprint for ${data.itinerary.name || activeDest} is ready.`,
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
  const handleFormSynthesize = (e: React.FormEvent) => {
    e.preventDefault()
    executeSynthesis({
      promptQuery: `Curate a ${days}-day circadian travel blueprint for ${destination} focusing on ${lens} at a ${pace} pace.`,
      targetDest: destination,
      targetDays: days,
      targetPace: pace,
      targetLens: lens,
      isFollowUp: false,
    })
  }

  // Handle Conversational AI Chat Box Submit
  const handleChatSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!conversationalInput.trim() || loading) return

    const query = conversationalInput.trim()
    setConversationalInput("")

    // Check if it's a follow-up refinement or a new destination query
    const isFollowUp = Boolean(itinerary)
    executeSynthesis({
      promptQuery: query,
      isFollowUp,
    })
  }

  // Handle 1-click Quick Prompt Pills
  const handlePillClick = (pill: typeof QUICK_PROMPT_PILLS[0]) => {
    setDestination(pill.dest)
    setDays(pill.days)
    setPace(pill.pace)
    setLens(pill.lens)
    executeSynthesis({
      promptQuery: pill.query,
      targetDest: pill.dest,
      targetDays: pill.days,
      targetPace: pill.pace,
      targetLens: pill.lens,
      isFollowUp: false,
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
      budget: `$${itinerary.budgetMin} — $${itinerary.budgetMax} / day`,
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
          estimatedCost: s.reserved ? "$75" : "Complimentary",
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
    const textSummary = `ROVEO Bespoke Itinerary: ${itinerary.name} (${itinerary.region})\nDuration: ${itinerary.duration}\nSeason: ${itinerary.season}\n\n${itinerary.description}\n\nHighlights:\n${itinerary.highlights.map((h) => `• ${h}`).join("\n")}\n\nDays:\n${itinerary.days.map((d) => `Day ${d.day} — ${d.theme}:\n${d.stops.map((s) => `  ${s.slot}: ${s.title} (${s.note})`).join("\n")}`).join("\n\n")}`
    navigator.clipboard.writeText(textSummary)
    toast({
      title: "Copied to Clipboard",
      description: "Itinerary summary copied successfully.",
    })
  }

  return (
    <div className="space-y-8 animate-reveal max-w-7xl mx-auto pb-24">
      {/* ─── Studio Header ─────────────────────────────────────────────────── */}
      <div className="glass-shell p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#38bdf8]/15 via-[#e8d5b5]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 glass-pill px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#e8d5b5]">
            <Sparkles className="w-3 h-3 text-[#38bdf8]" />
            Bespoke Circadian Engine
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-medium tracking-tight text-[#f1f5f9]">
            AI Travel <span className="italic text-[#e8d5b5]">Concierge</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-light">
            Your journey, your way. Curate circadian blueprints for any city, state, or small village on Earth in natural prose.
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={openModal}
            className="glass-pill px-4 py-2 text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
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
            className="glass-pill px-4 py-2 text-xs font-medium text-slate-200 hover:text-white flex items-center gap-2 transition-all hover:border-[#38bdf8]/50"
          >
            <Compass className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Atlas</span>
          </Link>
        </div>
      </div>

      {/* ─── 1. INTERACTIVE CONVERSATIONAL AI CHAT BOX (PROMINENT TOP HERO) ── */}
      <div className="glass-shell rounded-3xl p-5 sm:p-7 border border-white/15 shadow-2xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#e8d5b5]/10 via-[#38bdf8]/10 to-transparent blur-3xl pointer-events-none" />

        {/* Chat Box Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[#e8d5b5] shadow-[0_0_12px_rgba(232,213,181,0.3)]">
              <Sparkles className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <span>Conversational AI Concierge</span>
                <span className="text-[10px] font-normal uppercase tracking-widest text-[#e8d5b5] glass-pill px-2 py-0.5 rounded-full">
                  Universal Geography
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-light">
                Ask in natural language for any village, town, or capital on Earth. Follow up anytime to refine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#38bdf8] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
            <span>Ready for input</span>
          </div>
        </div>

        {/* Conversational Transcript History (if messages exist) */}
        {chatHistory.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 relative z-10 scrollbar-none pt-2 border-t border-white/10">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all ${
                  msg.role === "user"
                    ? "bg-[#38bdf8]/15 text-white ml-auto max-w-xl border border-[#38bdf8]/30 shadow-sm"
                    : "glass-card text-slate-200 mr-auto max-w-2xl border-white/15 border-l-4 border-l-[#e8d5b5]"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-1 opacity-70">
                  {msg.role === "user" ? "You" : "ROVEO Concierge"}
                </div>
                <p className="font-light">{msg.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Responsive Natural Language Input Bar */}
        <form onSubmit={handleChatSubmit} className="relative z-10">
          <div className="relative flex items-center">
            <div className="absolute left-4 flex items-center gap-2 text-slate-400">
              <span title="Natural Voice Prompt">
                <Mic className="w-4 h-4 text-[#e8d5b5] hover:text-white transition-colors cursor-pointer" />
              </span>
              <div className="w-[1px] h-4 bg-white/20 hidden sm:block" />
            </div>

            <input
              type="text"
              placeholder='e.g., "Plan a 4-day trip to Kolhapur exploring Mahalakshmi temple, Panhala fort & spicy Kolhapuri thali" or "Make day 2 more budget-friendly"...'
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
                  <span className="hidden sm:inline">Curating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-[#050a10]" />
                  <span>Curate Flow</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick-Prompt Suggestion Pills */}
        <div className="space-y-2 relative z-10 pt-1">
          <div className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3 text-[#38bdf8]" />
            <span>Instant Curations</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPT_PILLS.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePillClick(pill)}
                disabled={loading}
                className="text-xs glass-pill px-3.5 py-1.5 rounded-full text-slate-300 hover:text-white hover:border-[#e8d5b5]/50 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN TWO-COLUMN STUDIO LAYOUT ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Fine-Tuning Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleFormSynthesize} className="glass-shell p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-[#38bdf8]" />
                <span>Expedition Parameters</span>
              </div>
              <span className="text-[10px] text-[#e8d5b5] font-mono">Custom Flow</span>
            </div>

            {/* 1. Target City or Sanctuary Input */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium pl-1 flex items-center justify-between">
                <span>Target City, Town or Village</span>
                <span className="text-slate-400 font-light">Worldwide</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Kolhapur, Zermatt, Kyoto, Santorini"
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

            {/* 2. Duration Stepper */}
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

            {/* 3. Circadian Pace */}
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

            {/* 4. Curatorial Lens */}
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
                      Synthesizing Bespoke Itinerary
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
                  {/* Stage 1 */}
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

                  {/* Stage 2 */}
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

                  {/* Stage 3 */}
                  <div
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-xl transition-all ${
                      loadingStage >= 3
                        ? "text-white bg-white/[0.06] border border-white/10"
                        : "text-slate-500 opacity-40"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${loadingStage >= 3 ? "bg-[#34d399] shadow-[0_0_8px_#34d399]" : "bg-slate-600"}`} />
                    <span className="font-medium">Stage 3 (75–100%):</span>
                    <span className="font-light">✨ Finalizing insider concierge notes & cost telemetry...</span>
                  </div>
                </div>
              </div>

              {/* Shimmering Skeleton Cards */}
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
              {/* A. Editorial Concierge Narrative Box (chatReply) */}
              {itinerary.chatReply && (
                <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/20 border-l-4 border-l-[#e8d5b5] shadow-xl relative overflow-hidden space-y-2">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#e8d5b5] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Concierge Synthesis Note</span>
                  </div>
                  <p className="font-editorial text-sm sm:text-base text-slate-100 italic leading-relaxed">
                    "{itinerary.chatReply}"
                  </p>
                </div>
              )}

              {/* B. Header Showcase Card */}
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
                    <div className="text-[10px] uppercase text-slate-400 tracking-wider">Est. Daily Flow</div>
                    <div className="text-xs font-semibold text-[#38bdf8] mt-1">
                      ${itinerary.dailyCost} / day
                    </div>
                  </div>
                </div>

                {/* Highlights Chips */}
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

                {/* Luxury Cost Breakdown Telemetry Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium">
                    <span>Budget Telemetry Ratio</span>
                    <span className="text-slate-400">
                      Stays ({itinerary.costBreakdown[0]}%) • Dining ({itinerary.costBreakdown[1]}%) • Access ({itinerary.costBreakdown[2]}%) • Transit ({itinerary.costBreakdown[3]}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-white/10">
                    <div style={{ width: `${itinerary.costBreakdown[0]}%` }} className="bg-[#e8d5b5]" title="Boutique Stays" />
                    <div style={{ width: `${itinerary.costBreakdown[1]}%` }} className="bg-[#38bdf8]" title="Gastronomy" />
                    <div style={{ width: `${itinerary.costBreakdown[2]}%` }} className="bg-[#34d399]" title="Private Access" />
                    <div style={{ width: `${itinerary.costBreakdown[3]}%` }} className="bg-slate-400" title="Transit" />
                  </div>
                </div>
              </div>

              {/* C. Day Selector Tabs */}
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

              {/* D. Selected Day Circadian Timeline */}
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

              {/* E. Concierge Departure Prep Checklist */}
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

              {/* F. Inline Refinement Box */}
              <div className="glass-dock p-5 sm:p-6 rounded-3xl border border-white/15 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#f1f5f9]">
                    <MessageSquare className="w-4 h-4 text-[#38bdf8]" />
                    <span>Follow-Up Refinement</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Context Preserved</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    "Make day 2 more budget-friendly",
                    "Add authentic vegetarian food spots",
                    "Focus on scenic sunrise viewpoints",
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        executeSynthesis({
                          promptQuery: preset,
                          isFollowUp: true,
                        })
                      }
                      className="text-[10px] glass-pill px-2.5 py-1 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    placeholder="e.g., 'Replace afternoon transit with a walking tour'..."
                    value={conversationalInput}
                    onChange={(e) => setConversationalInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                    className="glass-input flex-1 px-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleChatSubmit()}
                    disabled={loading || !conversationalInput.trim()}
                    className="btn-luxe px-4 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-[#050a10]" />
                  </button>
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
                  Enter any global location into the Conversational AI Box above or pick a curated expedition to synthesize your bespoke blueprint.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() =>
                    handlePillClick(QUICK_PROMPT_PILLS[0])
                  }
                  className="btn-luxe px-6 py-3 rounded-full text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#050a10]" />
                  <span>Curate Kolhapur Preview</span>
                </button>

                <button
                  onClick={() =>
                    handlePillClick(QUICK_PROMPT_PILLS[2])
                  }
                  className="glass-pill px-6 py-3 rounded-full text-xs font-medium text-slate-200 hover:text-white inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Curate Kyoto Preview</span>
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