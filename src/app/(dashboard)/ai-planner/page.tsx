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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ItineraryTimeline } from "@/components/trip/itinerary-timeline"
import { useToast } from "@/hooks/use-toast"

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

      const data = await res.json()
      if (data.success && data.itinerary) {
        setItinerary(data.itinerary)
        setSelectedDay(1)
        setChatMessages([
          {
            role: "ai",
            text: `I've synthesized a personalized ${data.itinerary.durationDays || 7}-day itinerary for ${destination}! Ask me anything to adjust pacing, shift dates, reduce costs, or add intimate culinary gems.`,
          },
        ])
        toast({
          title: "Itinerary Synthesized",
          description: `Bespoke travel plan for ${destination} is ready.`,
        })
      } else {
        toast({
          title: "Generation Notice",
          description: data.error || "Unable to complete request. Please retry.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Connection Notice",
        description: "Failed to connect to ROVEO studio.",
        variant: "destructive",
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
          currentItinerary: itinerary,
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
    toast({
      title: "Saved to Your Archive",
      description: `"${itinerary?.title}" is safely stored in My Trips.`,
    })
    router.push("/trips")
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Editorial Header */}
      <div className="space-y-3 pb-8 border-b border-black/[0.08] dark:border-white/[0.08]">
        <span className="editorial-tag">ROVEO AI Studio</span>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
          Bespoke Trip Architecture
        </h1>
        <p className="text-sm text-[#78848C] max-w-2xl leading-relaxed">
          Synthesize custom travel blueprints in seconds. Tailor pacing, aesthetic preferences, and budget tier, then refine naturally with conversational intelligence.
        </p>
      </div>

      {/* ─── Planner Form ─────────────────────────────────────────────────── */}
      {!itinerary ? (
        <form onSubmit={handleGenerate} className="space-y-10 glass-dock p-6 sm:p-10 rounded-3xl border shadow-sm">
          {/* Step 1: Geographies & Windows */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#101E2B] dark:text-[#F8F7F4]">
              <span className="w-5 h-5 rounded-full bg-[#101E2B] text-white dark:bg-[#A5C7BA] dark:text-[#101E2B] text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Destination & Timing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="editorial-tag text-[9px] text-[#78848C]">
                  Origin
                </Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#78848C] absolute left-3.5 top-3.5" />
                  <Input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="pl-10 rounded-2xl h-11 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="editorial-tag text-[9px] text-[#78848C]">
                  Destination Territory *
                </Label>
                <div className="relative">
                  <Compass className="w-4 h-4 text-[#6D9D94] absolute left-3.5 top-3.5" />
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Kyoto, Amalfi, Patagonia"
                    className="pl-10 rounded-2xl h-11 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="editorial-tag text-[9px] text-[#78848C]">
                  Departure
                </Label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#78848C] absolute left-3.5 top-3.5" />
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="pl-10 rounded-2xl h-11 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="editorial-tag text-[9px] text-[#78848C]">
                  Return
                </Label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#78848C] absolute left-3.5 top-3.5" />
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="pl-10 rounded-2xl h-11 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Cadence & Budget */}
          <div className="space-y-4 pt-6 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#101E2B] dark:text-[#F8F7F4]">
              <span className="w-5 h-5 rounded-full bg-[#101E2B] text-white dark:bg-[#A5C7BA] dark:text-[#101E2B] text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Travel Cadence & Budget Tier</span>
            </div>

            {/* Guests Pill Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#78848C] font-medium">Party Size:</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTravelers(num)}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                      travelers === num
                        ? "bg-[#101E2B] dark:bg-[#A5C7BA] text-white dark:text-[#101E2B] font-semibold shadow-sm"
                        : "text-[#78848C] hover:bg-black/5 dark:hover:bg-white/5"
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
                      ? "border-[#6D9D94] bg-[#6D9D94]/10 shadow-sm"
                      : "border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <p className="font-semibold text-xs sm:text-sm text-[#18232D] dark:text-[#F8F7F4]">{opt.label}</p>
                  <p className="text-[11px] text-[#78848C] mt-1 leading-relaxed">{opt.desc}</p>
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
                      ? "border-[#6D9D94] bg-[#6D9D94]/10 shadow-sm"
                      : "border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <p className="font-semibold text-xs sm:text-sm text-[#18232D] dark:text-[#F8F7F4]">{opt.label}</p>
                  <p className="text-[11px] text-[#78848C] mt-1 leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Passions & Curiosities */}
          <div className="space-y-4 pt-6 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#101E2B] dark:text-[#F8F7F4]">
              <span className="w-5 h-5 rounded-full bg-[#101E2B] text-white dark:bg-[#A5C7BA] dark:text-[#101E2B] text-[10px] flex items-center justify-center font-bold">3</span>
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
                    className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
                      isSelected
                        ? "bg-[#101E2B] dark:bg-[#A5C7BA] text-white dark:text-[#101E2B] font-semibold shadow-sm"
                        : "bg-black/[0.04] dark:bg-white/[0.05] text-[#78848C] hover:text-[#18232D] dark:hover:text-[#F8F7F4]"
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
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] font-semibold text-xs sm:text-sm px-8 py-6 shadow-xl"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6D9D94] dark:text-[#101E2B]" />
                  <span>Synthesizing travel blueprint with AI...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#6D9D94] dark:text-[#101E2B]" />
                  <span>Synthesize Complete Blueprint</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      ) : (
        /* ─── Synthesized Blueprint View ──────────────────────────────────── */
        <div className="space-y-10">
          {/* Action Top Bar */}
          <div className="glass-dock p-5 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="editorial-tag text-[#6D9D94]">Blueprint Synthesized</span>
              <h2 className="font-display text-2xl font-bold text-[#18232D] dark:text-[#F8F7F4]">
                {itinerary.title}
              </h2>
              <p className="text-xs text-[#78848C] mt-0.5">
                {itinerary.destination} • {itinerary.durationDays || 7} Days • {itinerary.estimatedBudget}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItinerary(null)}
                className="rounded-full text-xs gap-1.5 border-black/10 dark:border-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-configure</span>
              </Button>

              <Button
                size="sm"
                onClick={handleSaveTrip}
                className="rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] text-xs font-semibold gap-1.5 shadow-sm"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save to Desk</span>
              </Button>
            </div>
          </div>

          {/* Overview & Budget Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 glass-dock p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4">
              <span className="editorial-tag">Overview</span>
              <h3 className="font-display text-xl font-bold text-[#18232D] dark:text-[#F8F7F4]">
                Journey Architecture
              </h3>
              <p className="text-xs sm:text-sm text-[#78848C] leading-relaxed">
                {itinerary.overview}
              </p>

              {itinerary.travelTips && (
                <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
                  <span className="editorial-tag text-[9px] text-[#6D9D94] flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Concierge Notes
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#78848C]">
                    {itinerary.travelTips.map((tip: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#6D9D94] font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Budget Breakdown */}
            <div className="md:col-span-4 glass-dock p-6 rounded-3xl border shadow-sm space-y-4">
              <span className="editorial-tag text-[#6D9D94]">Financial Model</span>
              <h3 className="font-display text-xl font-bold text-[#18232D] dark:text-[#F8F7F4]">
                Estimates
              </h3>
              <div className="space-y-2.5 text-xs">
                {itinerary.budgetBreakdown &&
                  Object.entries(itinerary.budgetBreakdown).map(([cat, amount]: any) => (
                    <div key={cat} className="flex justify-between py-1 border-b border-black/[0.06] dark:border-white/[0.06] capitalize text-[#78848C]">
                      <span>{cat.replace(/([A-Z])/g, " $1")}</span>
                      <span className="font-semibold text-[#18232D] dark:text-[#F8F7F4]">{amount}</span>
                    </div>
                  ))}
                <div className="pt-2 flex justify-between font-bold text-sm">
                  <span>Total Est.</span>
                  <span className="text-[#6D9D94]">{itinerary.estimatedBudget}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-dock p-6 sm:p-8 rounded-3xl border shadow-sm">
            <h3 className="font-display text-2xl font-bold mb-6">
              Day-by-Day Blueprint
            </h3>
            <ItineraryTimeline
              days={itinerary.days}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </div>

          {/* Follow-up Chat Assistant */}
          <div className="bg-[#101E2B] text-white p-6 sm:p-8 rounded-3xl border border-white/[0.1] shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-[#A5C7BA]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Conversational Refinement
                </h3>
                <p className="text-xs text-white/60">
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
                  className="px-3.5 py-1.5 rounded-full glass-pill hover:bg-white/20 transition-all text-[11px] font-medium text-white/90"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>

            {/* Message History */}
            <div className="space-y-3 max-h-72 overflow-y-auto p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl max-w-md ${
                      msg.role === "user"
                        ? "bg-[#6D9D94] text-white rounded-tr-none font-medium"
                        : "bg-white/[0.06] text-white/90 rounded-tl-none border border-white/[0.08]"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-[#A5C7BA] italic p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Refining travel blueprint...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Can you swap the afternoon for a private tea ceremony?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage()
                }}
                className="rounded-2xl h-11 text-xs sm:text-sm bg-white/[0.05] border-white/10 text-white placeholder-white/40"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={chatLoading || !chatInput.trim()}
                className="rounded-2xl bg-[#A5C7BA] hover:bg-[#8eb8a7] text-[#101E2B] font-semibold shrink-0 h-11 px-5"
              >
                <Send className="w-4 h-4" />
              </Button>
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
        <div className="py-24 text-center text-xs text-[#78848C]">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D9D94]" />
          Loading AI Studio...
        </div>
      }
    >
      <AIPlannerContent />
    </React.Suspense>
  )
}
