"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Compass,
  Calendar,
  Users,
  Search,
  ArrowRight,
  MapPin,
  Star,
  CheckCircle2,
  Sparkles,
  Sliders,
  ArrowUpRight,
  Bookmark,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import { DESTINATIONS, TRAVEL_STYLES } from "@/lib/constants"
import { DestinationCard } from "@/components/destination/destination-card"
import { InteractiveGlobe } from "@/components/globe/interactive-globe"

export default function HomePage() {
  const router = useRouter()
  const [destinationQuery, setDestinationQuery] = React.useState("")
  const [travelDates, setTravelDates] = React.useState("Oct 12 — Oct 20")
  const [travelers, setTravelers] = React.useState("2 Guests")

  // Curated subsets for varied editorial layouts
  const spotlightDestination = DESTINATIONS[0] // Santorini
  const editorialTrio = DESTINATIONS.slice(1, 4) // Kyoto, Bali, Paris
  const featuredCurations = DESTINATIONS.slice(6, 9) // Machu Picchu, Kenya Safari, Amalfi

  return (
    <div className="min-h-screen flex flex-col bg-[#050a10] text-[#f1f5f9] selection:bg-[#e8d5b5]/30 selection:text-white">
      <Navbar />

      {/* ─── 1. HERO SECTION: CINEMATIC EDITORIAL CAMPAIGN ────────────────── */}
      <section className="relative min-h-[96vh] sm:min-h-screen flex flex-col justify-between pt-28 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Full-Bleed High-Res Cinematic Travel Photograph (Strictly Bounded) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=2400&q=85"
            alt="Scenic coastline and turquoise waters"
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Refined Liquid Dark Cinema Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-[#050a10]/55 to-[#050a10]/70" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Top Spacer for Center Alignment */}
        <div className="relative z-10" />

        {/* Central Hero Typography */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 my-auto">
          {/* Micro Brand Tag */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-pill text-white/90 text-[11px] uppercase tracking-[0.22em] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8d5b5] shadow-[0_0_8px_#e8d5b5]" />
            <span>ROVEO Travel Architecture</span>
            <span className="text-white/40">•</span>
            <span className="text-[#e8d5b5]">Bespoke Journeys</span>
          </div>

          {/* Headline */}
          <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-[-0.03em] leading-[1.08] drop-shadow-lg">
            Some journeys deserve <br className="hidden sm:inline" />
            more than a search.
          </h1>

          {/* Supporting Copy */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-[#94a3b8] font-normal leading-relaxed">
            Discover extraordinary sanctuaries. Build unforgettable itineraries. Plan every detail your way with liquid glass precision.
          </p>

          {/* Primary & Secondary Action Triggers */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/ai-planner" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto btn-luxe px-8 py-4 text-xs sm:text-sm font-semibold gap-2 shadow-xl cursor-pointer">
                <span>Plan your journey</span>
                <ArrowRight className="w-4 h-4 text-[#050a10]" />
              </button>
            </Link>

            <Link href="/destinations" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto glass-pill px-8 py-4 text-xs sm:text-sm font-medium text-white hover:text-[#e8d5b5] rounded-full cursor-pointer">
                Explore destinations
              </button>
            </Link>
          </div>
        </div>

        {/* ─── Floating Architectural Glass Search Dock ────────────────────── */}
        <div className="relative z-10 max-w-4xl mx-auto w-full pt-8 sm:pt-12">
          <div className="glass-dock rounded-3xl p-3 sm:p-4 shadow-2xl border border-white/20">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
              {/* Where to */}
              <div className="sm:col-span-4 px-4 py-2.5 rounded-2xl glass-input">
                <span className="editorial-tag block text-[9px] text-[#e8d5b5]">
                  Where to?
                </span>
                <input
                  type="text"
                  placeholder="Kyoto, Amalfi, Patagonia..."
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-[#f1f5f9] placeholder-[#94a3b8]/60 focus:outline-none pt-0.5 border-none"
                />
              </div>

              {/* Travel dates */}
              <div className="sm:col-span-4 px-4 py-2.5 rounded-2xl glass-input">
                <span className="editorial-tag block text-[9px] text-[#e8d5b5]">
                  Travel Dates
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <input
                    type="text"
                    value={travelDates}
                    onChange={(e) => setTravelDates(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#f1f5f9] focus:outline-none border-none"
                  />
                </div>
              </div>

              {/* Travellers */}
              <div className="sm:col-span-2 px-4 py-2.5 rounded-2xl glass-input">
                <span className="editorial-tag block text-[9px] text-[#e8d5b5]">
                  Guests
                </span>
                <input
                  type="text"
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#f1f5f9] focus:outline-none pt-0.5 border-none"
                />
              </div>

              {/* Search Trigger */}
              <div className="sm:col-span-2">
                <Link
                  href={`/destinations?query=${encodeURIComponent(destinationQuery || "All")}`}
                  className="w-full block"
                >
                  <button className="w-full btn-luxe py-3.5 text-xs font-semibold gap-1.5 shadow-lg cursor-pointer">
                    <Search className="w-4 h-4 text-[#050a10]" />
                    <span>Search</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── A. TRENDING DESTINATIONS: EDITORIAL GALLERY ───────────────────── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 max-w-6xl mx-auto w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 sm:mb-16 gap-4">
          <div className="space-y-2">
            <span className="editorial-tag text-[#e8d5b5]">Curated Atlas</span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#f1f5f9]">
              Trending Sanctuaries
            </h2>
            <p className="text-sm text-[#94a3b8] max-w-xl">
              Hand-selected escapes distinguished by architectural heritage, sublime nature, and quiet refinement.
            </p>
          </div>

          <Link
            href="/destinations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#e8d5b5] hover:text-white transition-colors"
          >
            <span>View Full Portfolio (20+)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#38bdf8]" />
          </Link>
        </div>

        {/* ─── Hardware-Accelerated 3D WebGL Globe ────────────────────────── */}
        <InteractiveGlobe
          onSelectLocation={(pin) => {
            router.push(`/ai-planner?destination=${encodeURIComponent(pin.name)}`)
          }}
        />

        {/* Asymmetrical Layout: 1 Hero Spotlight + 3 Portrait Cards */}
        <div className="space-y-8">
          {/* Large Spotlight Card (Rule 2: Strict Bounded Image Container) */}
          <div className="relative rounded-3xl overflow-hidden glass-card shadow-2xl group border border-white/15">
            <div className="relative h-72 sm:h-96 w-full overflow-hidden">
              <Image
                src={spotlightDestination.image}
                alt={spotlightDestination.name}
                fill
                sizes="100vw"
                className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-[#050a10]/45 to-transparent" />

              <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex flex-col md:flex-row md:items-end justify-between gap-6 text-white z-10">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-[#e8d5b5]">
                      Spotlight Selection
                    </span>
                    <span className="text-xs text-white/60">•</span>
                    <span className="text-xs text-white/80">{spotlightDestination.location}, {spotlightDestination.country}</span>
                  </div>
                  <h3 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight">
                    {spotlightDestination.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed font-normal">
                    {spotlightDestination.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/destinations/${spotlightDestination.id}`}>
                    <button className="btn-luxe px-6 py-3 text-xs font-semibold gap-2 shadow-lg cursor-pointer">
                      <span>View Destination</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#050a10]" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Supporting Portrait Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {editorialTrio.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} variant="portrait" />
            ))}
          </div>
        </div>
      </section>

      {/* ─── B. EXPLORE YOUR WAY: THEMATIC MOOD BOARDS ────────────────────── */}
      <section className="py-24 border-y border-white/[0.08] relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-12 sm:mb-16 space-y-2">
            <span className="editorial-tag text-[#38bdf8]">Atmospheres</span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#f1f5f9]">
              Explore Your Way
            </h2>
            <p className="text-sm text-[#94a3b8]">
              Every journey reflects a personal state of mind. Select an atmosphere and allow our travel intelligence to curate the flow.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {TRAVEL_STYLES.slice(0, 4).map((style) => (
              <Link
                key={style.id}
                href={`/destinations?category=${encodeURIComponent(style.name)}`}
                className="group relative rounded-3xl overflow-hidden glass-card shadow-lg transition-all duration-500 hover:shadow-2xl"
              >
                {/* Strict Bounded Container (Rule 2) */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                  <Image
                    src={style.image}
                    alt={style.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-[#050a10]/40 to-transparent group-hover:opacity-90 transition-opacity" />

                  <div className="absolute bottom-5 left-5 right-5 text-white space-y-1 z-10">
                    <span className="editorial-tag text-[#e8d5b5] text-[9px]">
                      Collection
                    </span>
                    <h3 className="font-editorial text-2xl font-bold group-hover:text-[#e8d5b5] transition-colors">
                      {style.name}
                    </h3>
                    <p className="text-[11px] text-[#94a3b8] line-clamp-1">
                      {style.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── C. AI TRAVEL PLANNING: SOPHISTICATED SYNTHESIS ───────────────── */}
      <section id="ai-studio-section" className="py-28 sm:py-36 px-5 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-center">
          {/* Editorial Text Column */}
          <div className="lg:col-span-5 space-y-6">
            <span className="editorial-tag text-[#38bdf8]">Liquid Intelligence</span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#f1f5f9] leading-[1.15]">
              AI planning that values nuance over noise.
            </h2>
            <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
              We reject chaotic chatbot dumps. ROVEO’s AI engine was trained with the instincts of seasoned international concierges—balancing geographic proximity, natural circadian pace, and local secrets.
            </p>

            <ul className="space-y-3.5 text-xs sm:text-sm text-[#f1f5f9]/90 pt-1">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] mt-0.5 shrink-0" />
                <span>Respects your energy: mornings for monuments, unhurried afternoons.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] mt-0.5 shrink-0" />
                <span>Verified geographical routing to eliminate transit bottlenecks.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] mt-0.5 shrink-0" />
                <span>Real-time conversational refinement: "Make Day 4 more intimate."</span>
              </li>
            </ul>

            <div className="pt-4">
              <Link href="/ai-planner">
                <button className="btn-luxe px-8 py-3.5 text-xs sm:text-sm font-semibold gap-2 shadow-xl cursor-pointer">
                  <span>Enter AI Studio</span>
                  <ArrowRight className="w-4 h-4 text-[#050a10]" />
                </button>
              </Link>
            </div>
          </div>

          {/* Interactive AI Preview Canvas */}
          <div className="lg:col-span-7">
            <div className="glass-shell rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-5">
              {/* Studio Window Header */}
              <div className="flex items-center justify-between border-b border-white/[0.1] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]" />
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#e8d5b5]">
                    AERIS AI Concierge Desk
                  </span>
                </div>
                <span className="text-[10px] text-white/50 font-mono">v2.5 Synced</span>
              </div>

              {/* Sample Synthesized Day Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#e8d5b5] font-semibold">
                  <span>DAY 02 • KYOTO, JAPAN</span>
                  <span>TEMPO: BALANCED</span>
                </div>

                <div className="space-y-2.5">
                  <div className="glass-card p-4 rounded-2xl space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>07:30 AM — Dawn at Arashiyama Bamboo Grove</span>
                      <span className="text-[#38bdf8] text-[11px]">Free</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      Beat the mid-day arrival. Experience morning sunlight filtering through emerald bamboo stalks before public crowds arrive.
                    </p>
                  </div>

                  <div className="glass-card p-4 rounded-2xl space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>12:30 PM — Obanzai Lunch at Traditional Machiya</span>
                      <span className="text-[#e8d5b5] text-[11px]">$28</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      Sample seasonal heirloom vegetables and steamed dashi tofu in a preserved 100-year-old merchant townhouse courtyard.
                    </p>
                  </div>
                </div>

                {/* Natural follow-up chip */}
                <div className="p-3.5 rounded-2xl glass-pill flex items-center justify-between border-white/20">
                  <span className="text-xs text-[#e8d5b5] font-medium">
                    Prompt: "Swap afternoon activity for a Zen garden meditation"
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#38bdf8]">
                    Updated ✓
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── D. YOUR TRIP, YOUR CONTROL: MANUAL ITINERARY ─────────────────── */}
      <section className="py-24 sm:py-32 relative overflow-hidden border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-center">
            {/* Visual Timeline Studio Block */}
            <div className="lg:col-span-6 space-y-4">
              <div className="glass-shell rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.1] pb-4">
                  <div>
                    <span className="editorial-tag text-[#e8d5b5]">Manual Studio</span>
                    <h4 className="font-editorial text-2xl font-bold text-white">
                      Swiss Alps Summit Journey
                    </h4>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full glass-pill text-[#e8d5b5] font-medium">
                    7 Days
                  </span>
                </div>

                {/* Visual Step Timeline */}
                <div className="space-y-3 relative pl-6 border-l border-[#e8d5b5]/30 ml-2">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#e8d5b5] shadow-[0_0_6px_#e8d5b5]" />
                    <p className="text-xs font-semibold text-white">09:00 AM • First Cliff Walk Suspension Bridge</p>
                    <p className="text-[11px] text-[#94a3b8]">Grindelwald summit lookout above 2,168m elevation.</p>
                  </div>
                  <div className="relative pt-2">
                    <div className="absolute -left-[31px] top-3.5 w-2.5 h-2.5 rounded-full bg-white/40" />
                    <p className="text-xs font-semibold text-white">02:00 PM • Lake Brienz Paddle & Steamers</p>
                    <p className="text-[11px] text-[#94a3b8]">Turquoise alpine water crossing to Giessbach waterfalls.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <span className="editorial-tag text-[#e8d5b5]">Complete Autonomy</span>
              <h2 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                Your trip, your control. Every single hour.
              </h2>
              <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
                Some travelers relish the craft of hand-tuning every destination, reservation code, and walking trail. Our manual timeline builder gives you an elegant digital workspace with zero automated interference.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="glass-card p-4 rounded-2xl">
                  <p className="font-semibold text-sm text-white">Fine-Grain Scheduling</p>
                  <p className="text-xs text-[#94a3b8] mt-1">Reorder activities and add booking references.</p>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                  <p className="font-semibold text-sm text-white">Expense Tracking</p>
                  <p className="text-xs text-[#94a3b8] mt-1">Monitor running costs against target budgets.</p>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/manual-planner">
                  <button className="glass-pill px-8 py-3.5 text-xs sm:text-sm font-semibold text-white hover:text-[#e8d5b5] rounded-full cursor-pointer">
                    Launch Manual Studio →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── E. FEATURED JOURNEYS: MAGAZINE SPREAD ────────────────────────── */}
      <section className="py-28 sm:py-36 px-5 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <span className="editorial-tag text-[#e8d5b5]">Signature Itineraries</span>
          <h2 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#f1f5f9]">
            Featured Journeys
          </h2>
          <p className="text-sm text-[#94a3b8]">
            Explore complete blueprints planned by AERIS architects. Use as inspiration or customize for your dates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredCurations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} variant="portrait" />
          ))}
        </div>
      </section>

      {/* ─── F. FINAL CTA: ARCHITECTURAL CLOSING ──────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden glass-dock text-white p-10 sm:p-16 text-center space-y-6 shadow-2xl border border-white/20">
          {/* Subtle glow effect */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#38bdf8]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="editorial-tag text-[#e8d5b5]">Start Here</span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
              Begin planning your defining journey.
            </h2>
            <p className="text-sm text-[#94a3b8] font-normal leading-relaxed">
              Explore 20+ destinations across six continents or generate a bespoke 7-day itinerary in seconds. Free, elegant, and completely yours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/ai-planner" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto btn-luxe px-8 py-3.5 text-xs sm:text-sm font-semibold gap-2 shadow-xl cursor-pointer">
                  <span>Start AI Synthesis</span>
                  <ArrowRight className="w-4 h-4 text-[#050a10]" />
                </button>
              </Link>
              <Link href="/destinations" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto glass-pill px-8 py-3.5 text-xs sm:text-sm font-medium text-white hover:text-[#e8d5b5] rounded-full cursor-pointer">
                  Browse Atlas
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER & MOBILE DOCK ─────────────────────────────────────────── */}
      <Footer />
      <MobileNav />
    </div>
  )
}
