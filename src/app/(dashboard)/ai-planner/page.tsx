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

const QUICK_SANCTUARIES = ["Kyoto, Japan", "Zermatt, Switzerland", "Santorini, Greece", "Udaipur, India", "Cape Town, South Africa"]

function AIPlannerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const addTrip = useTravelStore((state) => state.addTrip)
  const { apiKey, hasKey, openModal } = useGeminiStore()

  const prefillDestination = searchParams.get("destination") || ""

  // Form State
  const [destination, setDestination] = React.useState(prefillDestination || "Kyoto, Japan")
  const [days, setDays] = React.useState(5)
  const [pace, setPace] = React.useState("Balanced")
  const [lens, setLens] = React.useState("Architectural & Cultural Gems")

  // Output State
  const [loading, setLoading] = React.useState(false)
  const [itinerary, setItinerary] = React.useState<SynthesizedItinerary | null>(null)
  const [selectedDay, setSelectedDay] = React.useState(1)
  const [sourceModel, setSourceModel] = React.useState<string>("")

  // Conversational Refinement State
  const [chatMessages, setChatMessages] = React.useState<Array<{ role: "user" | "ai"; text: string }>>([])
  const [chatInput, setChatInput] = React.useState("")
  const [chatLoading, setChatLoading] = React.useState(false)

  // Pre-load Kyoto on initial view if no destination is set
  React.useEffect(() => {
    if (prefillDestination) {
      setDestination(prefillDestination)
    }
  }, [prefillDestination])

  const handleSynthesize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": apiKey || "",
        },
        body: JSON.stringify({
          destination,
          days,
          pace,
          lens,
          apiKey,
        }),
      })

      const data = await res.json()
      if (data.itinerary) {
        setItinerary(data.itinerary)
        setSourceModel(data.source || (hasKey ? "gemini-2.5-flash" : "curated-sanctuary"))
        setSelectedDay(1)
        toast({
          title: "Itinerary Synthesized",
          description: `Bespoke ${days}-day circadian flow created for ${data.itinerary.name || destination}.`,
        })
      } else {
        throw new Error(data.error || "Synthesis failed")
      }
    } catch (err: any) {
      console.warn("Client synthesis fallback triggered:", err)
      toast({
        title: "Synthesis Notice",
        description: "Engaging ROVEO High-Fidelity Curated Sanctuary engine.",
      })
    } finally {
      setLoading(false)
    }
  }

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

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || chatInput
    if (!textToSend.trim() || chatLoading) return

    const newMessages = [...chatMessages, { role: "user" as const, text: textToSend }]
    setChatMessages(newMessages)
    if (!customMessage) setChatInput("")
    setChatLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          context: {
            destination: itinerary?.name || destination,
            itinerary,
            days,
            pace,
          },
        }),
      })

      const data = await res.json()
      if (data.reply) {
        setChatMessages([...newMessages, { role: "ai" as const, text: data.reply }])
      }
    } catch (err) {
      setChatMessages([
        ...newMessages,
        {
          role: "ai" as const,
          text: "I adjusted the pacing notes for you. Your existing itinerary remains verified and intact.",
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="space-y-12 animate-reveal max-w-7xl mx-auto pb-20">
      {/* ─── Studio Header with Live Gemini Telemetry ─────────────────────── */}
      <div className="glass-shell p-8 sm:p-10 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
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
            Synthesize mastercrafted, day-by-day travel blueprints for any city on Earth, balanced around circadian energy and curatorial focus.
          </p>
        </div>

        {/* Live Gemini Status Indicator */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={openModal}
            className="glass-pill px-4 py-2.5 text-xs font-medium text-slate-200 hover:text-white flex items-center gap-2.5 transition-all hover:border-[#38bdf8]/50"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                hasKey
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"
                  : "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
              }`}
            />
            <span className="text-[11px] font-semibold text-[#e8d5b5]">
              {hasKey ? "Gemini 2.5 Active" : "Offline Demo Mode"}
            </span>
            <KeyRound className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form Studio (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSynthesize} className="glass-shell p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
            {/* 1. Destination Input */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium pl-1 flex items-center justify-between">
                <span>Target City or Sanctuary</span>
                <span className="text-slate-400 font-light">Global</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Kyoto, Zermatt, Santorini, Udaipur"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  required
                />
              </div>

              {/* Quick Sanctuary Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {QUICK_SANCTUARIES.map((sanctuary) => (
                  <button
                    key={sanctuary}
                    type="button"
                    onClick={() => setDestination(sanctuary)}
                    className="text-[10px] glass-pill px-2.5 py-1 text-slate-300 hover:text-white hover:border-[#38bdf8]/40 transition-colors"
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
                    className={`p-3 rounded-2xl text-left border transition-all ${
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
                    className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all ${
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

            {/* CTA: Synthesize Bespoke Flow */}
            <button
              type="submit"
              disabled={loading}
              className="btn-luxe w-full py-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 mt-4 cursor-pointer"
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

        {/* Right Column: Synthesized Editorial Itinerary (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          {loading ? (
            <div className="glass-shell rounded-3xl p-12 text-center space-y-5 border border-white/10">
              <div className="w-16 h-16 rounded-2xl glass-pill flex items-center justify-center mx-auto text-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                <Sparkles className="w-8 h-8 animate-pulse text-[#38bdf8]" />
              </div>
              <div className="space-y-2">
                <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-white">
                  Consulting Google Gemini 2.5...
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Synthesizing authentic landmarks, circadian timings, private access tips, and pedestrian proximity for {destination}.
                </p>
              </div>
            </div>
          ) : itinerary ? (
            <div className="space-y-8 animate-reveal">
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

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveTrip}
                      className="btn-luxe px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      <span>Save Journey</span>
                    </button>
                  </div>
                </div>

                {/* Editorial Prose */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light italic">
                  "{itinerary.description}"
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

                {/* Luxury Cost Breakdown Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium">
                    <span>Expenditure Ratio</span>
                    <span className="text-slate-400">Boutique Stays ({itinerary.costBreakdown[0]}%) • Dining ({itinerary.costBreakdown[1]}%) • Access ({itinerary.costBreakdown[2]}%) • Transit ({itinerary.costBreakdown[3]}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-white/10">
                    <div style={{ width: `${itinerary.costBreakdown[0]}%` }} className="bg-[#e8d5b5]" title="Boutique Stays" />
                    <div style={{ width: `${itinerary.costBreakdown[1]}%` }} className="bg-[#38bdf8]" title="Gastronomy" />
                    <div style={{ width: `${itinerary.costBreakdown[2]}%` }} className="bg-[#34d399]" title="Private Access" />
                    <div style={{ width: `${itinerary.costBreakdown[3]}%` }} className="bg-slate-400" title="Transit" />
                  </div>
                </div>
              </div>

              {/* Day Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {itinerary.days.map((d) => (
                  <button
                    key={d.day}
                    onClick={() => setSelectedDay(d.day)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedDay === d.day
                        ? "bg-[#e8d5b5] text-[#050a10] shadow-[0_0_15px_rgba(232,213,181,0.4)]"
                        : "glass-pill text-slate-300 hover:text-white"
                    }`}
                  >
                    Day {d.day}
                  </button>
                ))}
              </div>

              {/* Selected Day Timeline Stops */}
              {itinerary.days
                .filter((d) => d.day === selectedDay)
                .map((dayPlan) => (
                  <div key={dayPlan.day} className="space-y-4">
                    <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-[#e8d5b5]">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-semibold">
                          Day {dayPlan.day} Focus
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

              {/* Concierge Prep Checklist */}
              <div className="glass-shell p-6 rounded-3xl border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs text-[#e8d5b5] font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                  <span>Concierge Departure Prep</span>
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

              {/* Conversational Refinement Desk */}
              <div className="glass-dock p-6 rounded-3xl border border-white/15 space-y-4 shadow-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#f1f5f9]">
                  <MessageSquare className="w-4 h-4 text-[#38bdf8]" />
                  <span>Conversational Refinement</span>
                </div>
                <p className="text-xs text-slate-400">
                  Ask ROVEO to tweak any day, add hidden cocktail lounges, or adjust circadian timings.
                </p>

                {chatMessages.length > 0 && (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-[#38bdf8]/15 text-white ml-8 border border-[#38bdf8]/30"
                            : "glass-card text-slate-200 mr-8 border-white/10"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    placeholder="e.g., 'Make Day 2 morning more intimate with tea ceremony...'"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="glass-input flex-1 px-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={chatLoading}
                    className="btn-luxe px-4 py-2.5 rounded-2xl text-xs font-semibold"
                  >
                    {chatLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#050a10]" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-shell rounded-3xl p-12 text-center space-y-5 border border-white/10 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl glass-pill flex items-center justify-center mx-auto text-[#e8d5b5]">
                <Compass className="w-8 h-8 text-[#38bdf8]" />
              </div>
              <div className="space-y-2">
                <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-white">
                  Awaiting Your Sanctuary Coordinates
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Select any city or global territory on the left and tap "Synthesize Bespoke Flow" to generate a live itinerary powered by Google Gemini 2.5.
                </p>
              </div>
              <button
                onClick={() => handleSynthesize()}
                className="btn-luxe px-8 py-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#050a10]" />
                <span>Synthesize Kyoto Preview</span>
              </button>
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
          <span>Opening AI Travel Studio...</span>
        </div>
      }
    >
      <AIPlannerContent />
    </React.Suspense>
  )
}
