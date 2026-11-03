"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
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
import { Button } from "@/components/ui/button"
import { DESTINATIONS, TRAVEL_STYLES } from "@/lib/constants"
import { DestinationCard } from "@/components/destination/destination-card"

export default function HomePage() {
  const [destinationQuery, setDestinationQuery] = React.useState("")
  const [travelDates, setTravelDates] = React.useState("Oct 12 — Oct 20")
  const [travelers, setTravelers] = React.useState("2 Guests")

  // Curated subsets for varied editorial layouts
  const spotlightDestination = DESTINATIONS[0] // Santorini
  const editorialTrio = DESTINATIONS.slice(1, 4) // Kyoto, Bali, Paris
  const secondaryDuo = DESTINATIONS.slice(4, 6) // Maldives, Iceland
  const featuredCurations = DESTINATIONS.slice(6, 9) // Machu Picchu, Kenya Safari, Amalfi

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] dark:bg-[#101E2B] text-[#18232D] dark:text-[#F8F7F4] selection:bg-[#A5C7BA]/40 selection:text-[#101E2B]">
      <Navbar />

      {/* ─── 1. HERO SECTION: CINEMATIC EDITORIAL CAMPAIGN ────────────────── */}
      <section className="relative min-h-[96vh] sm:min-h-screen flex flex-col justify-between pt-28 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Full-Bleed High-Res Cinematic Travel Photograph */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=2400&q=85"
            alt="Scenic coastline and turquoise waters"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Refined multi-stop cinema vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101E2B] via-[#101E2B]/45 to-[#101E2B]/60" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Top Spacer for Center Alignment */}
        <div className="relative z-10" />

        {/* Central Hero Typography */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 my-auto">
          {/* Micro Brand Tag */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-pill text-white/90 text-[11px] uppercase tracking-[0.22em] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A5C7BA]" />
            <span>ROVEO Travel Architecture</span>
            <span className="text-white/40">•</span>
            <span className="text-[#A5C7BA]">Bespoke Journeys</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-[-0.03em] leading-[1.08] drop-shadow-sm">
            Some journeys deserve <br className="hidden sm:inline" />
            more than a search.
          </h1>

          {/* Supporting Copy */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-[#F8F7F4]/85 font-normal leading-relaxed">
            Discover extraordinary places. Build unforgettable itineraries. Plan every detail your way.
          </p>

          {/* Primary & Secondary Action Triggers */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/ai-planner" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full bg-[#F8F7F4] hover:bg-white text-[#101E2B] font-semibold text-xs sm:text-sm px-8 py-6 shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <span>Plan your journey</span>
                <ArrowRight className="w-4 h-4 ml-2 text-[#6D9D94]" />
              </Button>
            </Link>

            <Link href="/destinations" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto rounded-full glass-pill text-white border-white/30 hover:bg-white/15 text-xs sm:text-sm px-8 py-6 font-medium transition-all duration-300"
              >
                Explore destinations
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── Floating Architectural Glass Search Dock ────────────────────── */}
        <div className="relative z-10 max-w-4xl mx-auto w-full pt-8 sm:pt-12">
          <div className="glass-dock rounded-3xl p-3 sm:p-3.5 shadow-2xl border border-white/40">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
              {/* Where to */}
              <div className="sm:col-span-4 px-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors">
                <span className="editorial-tag block text-[9px] text-[#78848C]">
                  Where to?
                </span>
                <input
                  type="text"
                  placeholder="Kyoto, Amalfi, Patagonia..."
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-[#18232D] dark:text-[#F8F7F4] placeholder-[#78848C]/60 focus:outline-none pt-0.5"
                />
              </div>

              {/* Travel dates */}
              <div className="sm:col-span-4 px-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors">
                <span className="editorial-tag block text-[9px] text-[#78848C]">
                  Travel Dates
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-[#6D9D94]" />
                  <input
                    type="text"
                    value={travelDates}
                    onChange={(e) => setTravelDates(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#18232D] dark:text-[#F8F7F4] focus:outline-none"
                  />
                </div>
              </div>

              {/* Travellers */}
              <div className="sm:col-span-2 px-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors">
                <span className="editorial-tag block text-[9px] text-[#78848C]">
                  Guests
                </span>
                <input
                  type="text"
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#18232D] dark:text-[#F8F7F4] focus:outline-none pt-0.5"
                />
              </div>

              {/* Search Trigger */}
              <div className="sm:col-span-2">
                <Link
                  href={`/destinations?query=${encodeURIComponent(destinationQuery || "All")}`}
                  className="w-full block"
                >
                  <Button
                    size="lg"
                    className="w-full rounded-2xl bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] font-semibold text-xs py-6 shadow-md transition-all hover:scale-[1.02]"
                  >
                    <Search className="w-4 h-4 mr-1.5" />
                    <span>Search</span>
                  </Button>
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
            <span className="editorial-tag">Curated Atlas</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
              Trending Destinations
            </h2>
            <p className="text-sm text-[#78848C] max-w-xl">
              Hand-selected escapes distinguished by architectural heritage, sublime nature, and quiet refinement.
            </p>
          </div>

          <Link
            href="/destinations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#6D9D94] hover:text-[#101E2B] dark:hover:text-[#F8F7F4] transition-colors"
          >
            <span>View Full Portfolio (20+)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Asymmetrical Magazine Layout: 1 Hero Spotlight + 3 Portrait Cards */}
        <div className="space-y-8">
          {/* Large Spotlight Card */}
          <div className="relative rounded-3xl overflow-hidden bg-[#101E2B] shadow-xl group">
            <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
              <Image
                src={spotlightDestination.image}
                alt={spotlightDestination.name}
                fill
                sizes="100vw"
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101E2B] via-[#101E2B]/40 to-transparent" />

              <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex flex-col md:flex-row md:items-end justify-between gap-6 text-white">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-[#A5C7BA]">
                      Spotlight Selection
                    </span>
                    <span className="text-xs text-white/60">•</span>
                    <span className="text-xs text-white/80">{spotlightDestination.location}, {spotlightDestination.country}</span>
                  </div>
                  <h3 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
                    {spotlightDestination.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
                    {spotlightDestination.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/destinations/${spotlightDestination.id}`}>
                    <Button className="rounded-full bg-white text-[#101E2B] hover:bg-white/90 text-xs px-6 py-5 font-semibold shadow-lg">
                      <span>View Destination</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-2 text-[#6D9D94]" />
                    </Button>
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
      <section className="py-24 bg-[#EAE6DF]/40 dark:bg-[#172B3A]/40 border-y border-black/[0.06] dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-12 sm:mb-16 space-y-2">
            <span className="editorial-tag">Atmospheres</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
              Explore Your Way
            </h2>
            <p className="text-sm text-[#78848C]">
              Every journey reflects a personal state of mind. Select an atmosphere and allow our travel intelligence to curate the flow.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {TRAVEL_STYLES.slice(0, 4).map((style) => (
              <Link
                key={style.id}
                href={`/destinations?category=${encodeURIComponent(style.name)}`}
                className="group relative rounded-3xl overflow-hidden aspect-[3/4] bg-[#101E2B] shadow-md transition-all duration-500 hover:shadow-2xl"
              >
                <Image
                  src={style.image}
                  alt={style.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101E2B] via-[#101E2B]/40 to-transparent group-hover:opacity-90 transition-opacity" />

                <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
                  <span className="editorial-tag text-[#A5C7BA] text-[9px]">
                    Collection
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold group-hover:text-[#A5C7BA] transition-colors">
                    {style.name}
                  </h3>
                  <p className="text-[11px] text-white/70 line-clamp-1">
                    {style.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── C. AI TRAVEL PLANNING: SOPHISTICATED SYNTHESIS ───────────────── */}
      <section className="py-28 sm:py-36 px-5 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-center">
          {/* Editorial Text Column */}
          <div className="lg:col-span-5 space-y-6">
            <span className="editorial-tag">Intelligence with Taste</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4] leading-[1.15]">
              AI planning that values nuance over noise.
            </h2>
            <p className="text-sm sm:text-base text-[#78848C] leading-relaxed">
              We reject chaotic chatbot dumps. ROVEO’s AI engine was trained with the instincts of seasoned international concierges—balancing geographic proximity, natural circadian pace, and local secrets.
            </p>

            <ul className="space-y-3.5 text-xs sm:text-sm text-[#18232D]/90 dark:text-[#F8F7F4]/90 pt-1">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#6D9D94] mt-0.5 shrink-0" />
                <span>Respects your energy: mornings for monuments, unhurried afternoons.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#6D9D94] mt-0.5 shrink-0" />
                <span>Verified geographical routing to eliminate frustrating transit bottlenecks.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#6D9D94] mt-0.5 shrink-0" />
                <span>Real-time conversational refinement: "Make Day 4 more intimate."</span>
              </li>
            </ul>

            <div className="pt-4">
              <Link href="/ai-planner">
                <Button className="rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] px-8 py-6 text-xs sm:text-sm font-semibold shadow-lg">
                  <span>Enter AI Studio</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive AI Preview Canvas */}
          <div className="lg:col-span-7">
            <div className="bg-[#101E2B] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/[0.1] relative space-y-5">
              {/* Studio Window Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#A5C7BA]" />
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#A5C7BA]">
                    ROVEO AI Travel Studio
                  </span>
                </div>
                <span className="text-[10px] text-white/50 font-mono">v2.5 Synced</span>
              </div>

              {/* Sample Synthesized Day Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#A5C7BA] font-semibold">
                  <span>DAY 02 • KYOTO, JAPAN</span>
                  <span>TEMPO: BALANCED</span>
                </div>

                <div className="space-y-2.5">
                  <div className="bg-white/[0.05] p-4 rounded-2xl border border-white/[0.08] space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>07:30 AM — Dawn at Arashiyama Bamboo Grove</span>
                      <span className="text-[#A5C7BA] text-[11px]">Free</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Beat the mid-day arrival. Experience morning sunlight filtering through emerald bamboo stalks before public crowds arrive.
                    </p>
                  </div>

                  <div className="bg-white/[0.05] p-4 rounded-2xl border border-white/[0.08] space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>12:30 PM — Obanzai Lunch at Traditional Machiya</span>
                      <span className="text-[#A5C7BA] text-[11px]">$28</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Sample seasonal heirloom vegetables and steamed dashi tofu in a preserved 100-year-old merchant townhouse courtyard.
                    </p>
                  </div>
                </div>

                {/* Natural follow-up chip */}
                <div className="p-3.5 rounded-2xl bg-[#6D9D94]/15 border border-[#6D9D94]/30 flex items-center justify-between">
                  <span className="text-xs text-[#A5C7BA] font-medium">
                    Prompt: "Swap afternoon activity for a Zen garden meditation"
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">
                    Updated ✓
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── D. YOUR TRIP, YOUR CONTROL: MANUAL ITINERARY ─────────────────── */}
      <section className="py-24 sm:py-32 bg-[#172B3A] text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-center">
            {/* Visual Timeline Studio Block */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#101E2B] rounded-3xl p-6 sm:p-8 border border-white/[0.1] shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <span className="editorial-tag text-[#A5C7BA]">Manual Architect</span>
                    <h4 className="font-display text-xl font-bold text-white">
                      Swiss Alps Summit Journey
                    </h4>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white font-medium">
                    7 Days
                  </span>
                </div>

                {/* Visual Step Timeline */}
                <div className="space-y-3 relative pl-6 border-l border-[#6D9D94]/30 ml-2">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#A5C7BA]" />
                    <p className="text-xs font-semibold text-white">09:00 AM • First Cliff Walk Suspension Bridge</p>
                    <p className="text-[11px] text-white/60">Grindelwald summit lookout above 2,168m elevation.</p>
                  </div>
                  <div className="relative pt-2">
                    <div className="absolute -left-[31px] top-3.5 w-2.5 h-2.5 rounded-full bg-white/40" />
                    <p className="text-xs font-semibold text-white">02:00 PM • Lake Brienz Paddle & Steamers</p>
                    <p className="text-[11px] text-white/60">Turquoise alpine water crossing to Giessbach waterfalls.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <span className="editorial-tag text-[#A5C7BA]">Complete Autonomy</span>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                Your trip, your control. Every single hour.
              </h2>
              <p className="text-sm sm:text-base text-[#F8F7F4]/75 leading-relaxed">
                Some travelers relish the craft of hand-tuning every destination, reservation code, and walking trail. Our manual timeline builder gives you an elegant digital workspace with zero automated interference.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-white/[0.05] p-4 rounded-2xl border border-white/[0.08]">
                  <p className="font-semibold text-sm text-white">Fine-Grain Scheduling</p>
                  <p className="text-xs text-white/60 mt-1">Reorder activities and add booking references.</p>
                </div>
                <div className="bg-white/[0.05] p-4 rounded-2xl border border-white/[0.08]">
                  <p className="font-semibold text-sm text-white">Expense Tracking</p>
                  <p className="text-xs text-white/60 mt-1">Monitor running costs against target budgets.</p>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/manual-planner">
                  <Button variant="outline" className="rounded-full glass-pill text-white px-8 py-6 text-xs sm:text-sm font-semibold">
                    Launch Manual Studio →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── E. FEATURED JOURNEYS: MAGAZINE SPREAD ────────────────────────── */}
      <section className="py-28 sm:py-36 px-5 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <span className="editorial-tag">Signature Itineraries</span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
            Featured Journeys
          </h2>
          <p className="text-sm text-[#78848C]">
            Explore complete blueprints planned by ROVEO architects. Use as inspiration or customize for your dates.
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
        <div className="relative rounded-3xl overflow-hidden bg-[#101E2B] text-white p-10 sm:p-16 text-center space-y-6 shadow-2xl border border-white/[0.1]">
          {/* Subtle glow effect */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#6D9D94]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="editorial-tag text-[#A5C7BA]">Start Here</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
              Begin planning your defining journey.
            </h2>
            <p className="text-sm text-white/75 font-normal leading-relaxed">
              Explore 20+ destinations across six continents or generate a bespoke 7-day itinerary in seconds. Free, elegant, and completely yours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link href="/ai-planner" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-full bg-[#F8F7F4] hover:bg-white text-[#101E2B] px-8 py-6 text-xs sm:text-sm font-semibold shadow-lg">
                  <span>Start AI Synthesis</span>
                  <ArrowRight className="w-4 h-4 ml-2 text-[#6D9D94]" />
                </Button>
              </Link>
              <Link href="/destinations" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-full glass-pill text-white px-8 py-6 text-xs sm:text-sm font-medium hover:bg-white/10"
                >
                  Browse Atlas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}
