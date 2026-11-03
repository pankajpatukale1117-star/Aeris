"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
} from "lucide-react"
import { ItineraryTimeline } from "@/components/trip/itinerary-timeline"
import { useToast } from "@/hooks/use-toast"
import { useTravelStore, StoredTrip } from "@/lib/store/travel-store"
import { DESTINATIONS } from "@/lib/constants"

const INTEREST_OPTIONS = [
  "Adventure",
  "Nature",
  "Beaches",
  "Mountains",
  "Food & Wine",
  "Culture",
  "History",
  "Architecture",
  "Photography",
  "Relaxation",
  "Nightlife",
]

const PACE_OPTIONS = [
  { value: "relaxed", label: "Unhurried Pace", desc: "1—2 key experiences daily with spacious afternoons." },
  { value: "balanced", label: "Balanced Cadence", desc: "2—3 curated highlights with comfortable breathing room." },
  { value: "packed", label: "Immersive Exploration", desc: "High-density itinerary to maximize your time." },
]

const BUDGET_OPTIONS = [
  { value: "budget", label: "Considered / Savvy", desc: "Authentic local stays, street markets, rail passes." },
  { value: "mid-range", label: "Refined Comfort", desc: "Boutique heritage hotels, private drivers, local bistros." },
  { value: "luxury", label: "Bespoke Luxury", desc: "5-star sanctuaries, fine dining, private guides." },
]

function AIPlannerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const addTrip = useTravelStore((state) => state.addTrip)

  const prefillDestination = searchParams.get("destination") || ""

  // Form State
  const [origin, setOrigin] = React.useState("New York, USA")
  const [destination, setDestination] = React.useState(prefillDestination || "Kyoto, Japan")
  const [departureDate, setDepartureDate] = React.useState("2026-11-15")
  const [returnDate, setReturnDate] = React.useState("2026-11-22")
  const [travelers, setTravelers] = React.useState(2)
  const [budget, setBudget] = React.useState("mid-range")
  const [pace, setPace] = React.useState("balanced")
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>([
    "Culture",
    "Food & Wine",
    "Nature",
  ])

  // Generator & Output State
  const [loading, setLoading] = React.useState(false)
  const [itinerary, setItinerary] = React.useState<any | null>(null)
  const [selectedDay, setSelectedDay] = React.useState(1)

  // Follow-up Chat State
  const [chatMessages, setChatMessages] = React.useState<Array<{ role: "user" | "ai"; text: string }>>([])
  const [chatInput, setChatInput] = React.useState("")
  const [chatLoading, setChatLoading] = React.useState(false)

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/ai/generate-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          departureDate,
          returnDate,
          travelers,
          budget,
          pace,
          interests: selectedInterests,
        }),
      })

      if (!res.ok) throw new Error("Synthesis failed")

      const data = await res.json()
      if (data.itinerary) {
        setItinerary(data.itinerary)
        setSelectedDay(1)
        toast({
          title: "Itinerary Synthesized",
          description: `Custom itinerary generated for ${destination}.`,
        })
      }
    } catch (err: any) {
      toast({
        title: "Synthesis Notice",
        description: "Engaging high-fidelity concierge fallback.",
      })
    } finally {
      setLoading(false)
    }
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
            destination,
            itinerary,
            travelers,
            budget,
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
          text: "I couldn't process that update right now. Your existing itinerary remains intact.",
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const handleSaveTrip = () => {
    if (!itinerary) return

    const matchedDest = DESTINATIONS.find(
      (d) =>
        d.name.toLowerCase() === destination.toLowerCase() ||
        destination.toLowerCase().includes(d.name.toLowerCase()) ||
        (itinerary.destination && d.name.toLowerCase().includes(itinerary.destination.toLowerCase()))
    )

    const coverImage = matchedDest
      ? matchedDest.image
      : "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80"

    const newTripId = `trip-ai-${Date.now()}`
    const newTrip: StoredTrip = {
      id: newTripId,
      title: itinerary.title || `Curated Journey to ${destination}`,
      destination: destination,
      dates: `${departureDate} — ${returnDate}`,
      startDate: departureDate,
      endDate: returnDate,
      daysCount: itinerary.days?.length || 7,
      travelers: travelers,
      budget: itinerary.estimatedBudget || undefined,
      status: "upcoming",
      planningMode: "AI Architecture",
      coverImage: coverImage,
      notes: itinerary.travelTips ? itinerary.travelTips.join("\n• ") : itinerary.overview,
      coordinates: [35.0116, 135.7681],
      days: (itinerary.days || []).map((d: any, idx: number) => ({
        dayNumber: d.dayNumber || idx + 1,
        date: d.date || `Day ${d.dayNumber || idx + 1}`,
        title: d.title || `Day ${idx + 1} Program`,
        description: d.description || "",
        activities: (d.activities || []).map((a: any, actIdx: number) => ({
          id: a.id || `act-ai-${idx}-${actIdx}-${Date.now()}`,
          time: a.time || "10:00",
          title: a.title,
          description: a.description || "",
          location: a.location || destination,
          duration: a.duration || "1.5h",
          estimatedCost: a.estimatedCost || "Free",
          category: a.category || "Sightseeing",
        })),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addTrip(newTrip)
    toast({
      title: "Synthesized Itinerary Stored",
      description: `"${newTrip.title}" has been saved to your Travel Desk.`,
    })
    router.push(`/trips/${newTrip.id}`)
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Editorial Header */}
      <div className="space-y-3 pb-8 border-b border-white/[0.08]">
        <span className="editorial-tag text-[#e8d5b5]">ROVEO AI Concierge</span>
        <h1 className="font-editorial text-4xl sm:text-6xl font-bold tracking-tight text-[#f1f5f9]">
          Bespoke Trip Architecture
        </h1>
        <p className="text-sm text-[#94a3b8] max-w-2xl leading-relaxed">
          Synthesize custom travel blueprints in seconds. Tailor pacing, aesthetic preferences, and budget tier, then refine naturally with conversational intelligence.
        </p>
      </div>

      {/* ─── Planner Form ─────────────────────────────────────────────────── */}
      {!itinerary ? (
        <form onSubmit={handleGenerate} className="space-y-10 glass-shell p-6 sm:p-10 rounded-3xl border border-white/15 shadow-2xl">
          {/* Step 1: Geographies & Windows */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e8d5b5]">
              <span className="w-5 h-5 rounded-full bg-[#e8d5b5] text-[#050a10] text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Destination & Timing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="editorial-tag text-[9px] text-[#e8d5b5]">
                  Origin
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3.5" />
                  <input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full pl-10 rounded-2xl h-11 text-xs sm:text-sm glass-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="editorial-tag text-[9px] text-[#e8d5b5]">
                  Destination Territory *
                </label>
                <div className="relative">
                  <Compass className="w-4 h-4 text-[#38bdf8] absolute left-3.5 top-3.5" />
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Kyoto, Amalfi, Patagonia"
                    className="w-full pl-10 rounded-2xl h-11 text-xs sm:text-sm glass-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="editorial-tag text-[9px] text-[#e8d5b5]">
                  Departure
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3.5" />
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full pl-10 rounded-2xl h-11 text-xs sm:text-sm glass-input cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="editorial-tag text-[9px] text-[#e8d5b5]">
                  Return
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3.5" />
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full pl-10 rounded-2xl h-11 text-xs sm:text-sm glass-input cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Cadence & Budget */}
          <div className="space-y-4 pt-6 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e8d5b5]">
              <span className="w-5 h-5 rounded-full bg-[#e8d5b5] text-[#050a10] text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Travel Cadence & Budget Tier</span>
            </div>

            {/* Guests Pill Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#94a3b8] font-medium">Party Size:</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTravelers(num)}
                    className={`glass-pill px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                      travelers === num
                        ? "active font-bold text-white shadow-[0_0_12px_rgba(232,213,181,0.25)]"
                        : "text-[#94a3b8]"
                    }`}
                  >
                    {num} {num === 1 ? "Solo" : "Guests"}
                  </button>
                ))}
              </div>
            </div>

            {/* Pacing Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {PACE_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setPace(opt.value)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    pace === opt.value
                      ? "border-[#e8d5b5] bg-white/[0.1] shadow-lg"
                      : "border-white/10 glass-card hover:border-white/20"
                  }`}
                >
                  <p className="font-semibold text-xs sm:text-sm text-white">{opt.label}</p>
                  <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>

            {/* Budget Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {BUDGET_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setBudget(opt.value)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    budget === opt.value
                      ? "border-[#e8d5b5] bg-white/[0.1] shadow-lg"
                      : "border-white/10 glass-card hover:border-white/20"
                  }`}
                >
                  <p className="font-semibold text-xs sm:text-sm text-white">{opt.label}</p>
                  <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Passions & Curiosities */}
          <div className="space-y-4 pt-6 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e8d5b5]">
              <span className="w-5 h-5 rounded-full bg-[#e8d5b5] text-[#050a10] text-[10px] flex items-center justify-center font-bold">3</span>
              <span>Passions & Curiosities</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = selectedInterests.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`glass-pill px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                      isSelected
                        ? "active font-bold text-white shadow-[0_0_12px_rgba(232,213,181,0.25)] border-[#e8d5b5]"
                        : "text-[#94a3b8]"
                    }`}
                  >
                    {interest} {isSelected ? "✓" : "+"}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-luxe w-full sm:w-auto px-8 py-4 text-xs sm:text-sm font-semibold gap-2 shadow-2xl cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#050a10]" />
                  <span>Synthesizing travel blueprint with AI...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#050a10]" />
                  <span>Synthesize Complete Blueprint</span>
                </div>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* ─── Synthesized Blueprint View ──────────────────────────────────── */
        <div className="space-y-10">
          {/* Action Top Bar */}
          <div className="glass-dock p-6 rounded-3xl border border-white/15 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="editorial-tag text-[#38bdf8]">Blueprint Synthesized</span>
              <h2 className="font-editorial text-3xl font-bold text-white">
                {itinerary.title}
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                {itinerary.destination} • {itinerary.durationDays || 7} Days • {itinerary.estimatedBudget}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setItinerary(null)}
                className="glass-pill px-4 py-2.5 rounded-full text-xs font-semibold text-white hover:text-[#e8d5b5] flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-configure</span>
              </button>

              <button
                onClick={handleSaveTrip}
                className="btn-luxe px-5 py-2.5 text-xs font-semibold gap-1.5 shadow-lg cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[#050a10]" />
                <span>Save to Desk</span>
              </button>
            </div>
          </div>

          {/* Overview & Budget Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 glass-dock p-6 sm:p-8 rounded-3xl border border-white/15 shadow-xl space-y-4">
              <span className="editorial-tag text-[#e8d5b5]">Overview</span>
              <h3 className="font-editorial text-2xl font-bold text-white">
                Journey Architecture
              </h3>
              <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
                {itinerary.overview}
              </p>

              {itinerary.travelTips && (
                <div className="pt-4 border-t border-white/[0.08] space-y-2">
                  <span className="editorial-tag text-[9px] text-[#38bdf8] flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Concierge Notes
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#94a3b8]">
                    {itinerary.travelTips.map((tip: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#e8d5b5] font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Budget Breakdown */}
            <div className="md:col-span-4 glass-dock p-6 rounded-3xl border border-white/15 shadow-xl space-y-4">
              <span className="editorial-tag text-[#38bdf8]">Financial Model</span>
              <h3 className="font-editorial text-2xl font-bold text-white">
                Estimates
              </h3>
              <div className="space-y-2.5 text-xs">
                {itinerary.budgetBreakdown &&
                  Object.entries(itinerary.budgetBreakdown).map(([cat, amount]: any) => (
                    <div key={cat} className="flex justify-between py-1 border-b border-white/[0.06] capitalize text-[#94a3b8]">
                      <span>{cat.replace(/([A-Z])/g, " $1")}</span>
                      <span className="font-semibold text-white">{amount}</span>
                    </div>
                  ))}
                <div className="pt-2 flex justify-between font-bold text-sm">
                  <span className="text-white">Total Est.</span>
                  <span className="text-[#e8d5b5]">{itinerary.estimatedBudget}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-shell p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl">
            <h3 className="font-editorial text-3xl font-bold mb-6 text-white">
              Day-by-Day Blueprint
            </h3>
            <ItineraryTimeline
              days={itinerary.days}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </div>

          {/* Follow-up Chat Assistant */}
          <div className="glass-shell p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-[#38bdf8]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-editorial font-bold text-xl text-white">
                  Conversational Refinement
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Ask follow-up questions to customize or rebalance this itinerary on the fly.
                </p>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                "Make this trip cheaper",
                "Add more adventure activities",
                "Remove crowded destinations",
                "Make the itinerary more relaxed",
                "Recommend artisan street food",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessage(suggestion)}
                  disabled={chatLoading}
                  className="glass-pill px-3.5 py-1.5 rounded-full text-[11px] font-medium text-white hover:text-[#e8d5b5] cursor-pointer"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>

            {/* Chat Transcript */}
            {chatMessages.length > 0 && (
              <div className="space-y-3 pt-3 max-h-80 overflow-y-auto pr-1">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-white/[0.08] text-white ml-auto max-w-md border border-white/15"
                        : "glass-card text-[#f1f5f9] mr-auto max-w-lg border border-white/20"
                    }`}
                  >
                    <span className="editorial-tag text-[9px] block mb-1 text-[#e8d5b5]">
                      {msg.role === "user" ? "You" : "Concierge"}
                    </span>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Input Bar */}
            <div className="flex gap-2 pt-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask to adjust pacing, swap an activity, or add restaurant recommendations..."
                className="flex-1 glass-input rounded-2xl px-4 py-3 text-xs"
                disabled={chatLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={chatLoading || !chatInput.trim()}
                className="btn-luxe px-5 rounded-2xl cursor-pointer"
              >
                {chatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#050a10]" />
                ) : (
                  <Send className="w-4 h-4 text-[#050a10]" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AIPlannerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#e8d5b5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#94a3b8]">Initializing AI studio...</p>
        </div>
      }
    >
      <AIPlannerContent />
    </React.Suspense>
  )
}
