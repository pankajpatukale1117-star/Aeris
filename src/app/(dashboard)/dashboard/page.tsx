"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Sparkles,
  Calendar,
  Compass,
  MapPin,
  Bookmark,
  PlusCircle,
  Clock,
  ArrowRight,
  Globe,
  Sliders,
  ArrowUpRight,
  Plane,
} from "lucide-react"
import { DESTINATIONS } from "@/lib/constants"
import { DestinationCard } from "@/components/destination/destination-card"
import { useTravelStore } from "@/lib/store/travel-store"

export default function DashboardPage() {
  const user = useTravelStore((state) => state.user)
  const trips = useTravelStore((state) => state.trips)
  const savedDestinationIds = useTravelStore((state) => state.savedDestinationIds)

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const activeJourney = React.useMemo(() => {
    if (!mounted || trips.length === 0) return null
    return (
      trips.find((t) => t.status === "upcoming") ||
      trips.find((t) => t.status === "planning") ||
      trips[0]
    )
  }, [mounted, trips])

  const savedHighlights = React.useMemo(() => {
    if (!mounted) return []
    return DESTINATIONS.filter((d) => savedDestinationIds.includes(d.id)).slice(0, 3)
  }, [mounted, savedDestinationIds])

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* ─── 1. Editorial Welcome & Traveler Status ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#e8d5b5]/40 shrink-0 shadow-lg bg-[#050a10] flex items-center justify-center">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.fullName || "User"}
                fill
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-editorial font-bold text-2xl text-[#e8d5b5]">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "R"}
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            <span className="editorial-tag text-[#38bdf8]">
              {user.tier || "Passport Concierge"} • Active Travel Desk
            </span>
            <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#f1f5f9]">
              Welcome back, {user.fullName ? user.fullName.split(" ")[0] : "Traveler"}
            </h1>
            <p className="text-xs sm:text-sm text-[#94a3b8]">
              Your journey. Your rules. Your world.
            </p>
          </div>
        </div>

        {/* Dual Planning Shortcuts */}
        <div className="flex items-center gap-3">
          <Link href="/ai-planner">
            <button className="btn-luxe px-5 py-3 text-xs font-semibold gap-2 shadow-lg cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-[#050a10]" />
              <span>AI Concierge</span>
            </button>
          </Link>

          <Link href="/manual-planner">
            <button className="glass-pill px-5 py-3 text-xs font-semibold text-[#f1f5f9] hover:text-[#e8d5b5] rounded-full gap-2 flex items-center cursor-pointer">
              <PlusCircle className="w-3.5 h-3.5 text-[#e8d5b5]" />
              <span>Manual Studio</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ─── 2. Spotlight: Active Upcoming Journey ─────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="editorial-tag text-[#e8d5b5]">Next Departure</span>
          <Link
            href="/trips"
            className="text-xs font-semibold text-[#38bdf8] hover:text-white transition-colors"
          >
            All Saved Journeys ({mounted ? trips.length : "..."}) →
          </Link>
        </div>

        {activeJourney ? (
          /* Cinematic Journey Spotlight Card (Rule 2: Image strictly bounded) */
          <Link
            href={`/trips/${activeJourney.id}`}
            className="group block relative rounded-3xl overflow-hidden glass-card shadow-2xl transition-all duration-500 hover:shadow-2xl border border-white/15"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
              {/* Image Canvas */}
              <div className="md:col-span-5 relative h-64 md:h-auto min-h-[260px] w-full overflow-hidden">
                <Image
                  src={activeJourney.coverImage || "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80"}
                  alt={activeJourney.title}
                  fill
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#050a10] via-transparent to-transparent opacity-80" />
              </div>

              {/* Details Panel */}
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-[#e8d5b5]">
                      {activeJourney.status}
                    </span>
                    <span className="text-xs text-white/50">•</span>
                    <span className="text-xs text-[#38bdf8] font-medium">{activeJourney.planningMode}</span>
                  </div>

                  <h3 className="font-editorial text-2xl sm:text-4xl font-bold tracking-tight text-white group-hover:text-[#e8d5b5] transition-colors">
                    {activeJourney.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed font-normal">
                    {activeJourney.notes || `Curated itinerary covering ${activeJourney.destination} across ${activeJourney.days?.length || activeJourney.daysCount} planned days.`}
                  </p>
                </div>

                {/* Progress & Metadata */}
                <div className="pt-4 border-t border-white/[0.1] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
                    <span className="flex items-center gap-1.5 text-[#e8d5b5]">
                      <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
                      {activeJourney.dates}
                    </span>
                    <span className="font-semibold text-[#e8d5b5] flex items-center gap-1">
                      <span>View Master Blueprint</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#38bdf8]" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="p-8 sm:p-12 glass-dock rounded-3xl border border-white/15 text-center space-y-4 max-w-lg mx-auto">
            <Plane className="w-10 h-10 text-[#38bdf8] mx-auto stroke-1" />
            <h3 className="font-editorial text-3xl font-bold text-white">
              Ready for your next journey?
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Your travel desk is currently clear. Use our AI Travel Studio to synthesize a full multi-day itinerary in seconds, or craft one by hand.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link href="/ai-planner">
                <button className="btn-luxe px-6 py-2.5 text-xs font-semibold cursor-pointer">
                  Launch AI Studio
                </button>
              </Link>
              <Link href="/manual-planner">
                <button className="glass-pill px-6 py-2.5 text-xs text-white hover:text-[#e8d5b5] rounded-full cursor-pointer">
                  Manual Builder
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. Saved Destinations: Thematic Visual Strip ─────────────────── */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="editorial-tag text-[#38bdf8]">Wishlist</span>
            <h2 className="font-editorial text-2xl sm:text-4xl font-bold tracking-tight text-[#f1f5f9]">
              Saved Sanctuaries
            </h2>
          </div>
          <Link
            href="/saved"
            className="text-xs font-semibold text-[#e8d5b5] hover:text-white transition-colors"
          >
            View All Saved ({mounted ? savedDestinationIds.length : "..."}) →
          </Link>
        </div>

        {savedHighlights.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {savedHighlights.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                isSaved={true}
                variant="portrait"
              />
            ))}
          </div>
        ) : (
          <div className="p-8 glass-dock rounded-3xl border border-white/15 text-center space-y-3">
            <Bookmark className="w-8 h-8 text-[#94a3b8] mx-auto stroke-1" />
            <h4 className="font-editorial font-bold text-xl text-white">No destinations saved yet</h4>
            <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
              Explore the global atlas and save sanctuaries you would like to incorporate into future trips.
            </p>
            <Link href="/destinations" className="inline-block pt-1">
              <button className="glass-pill px-5 py-2 rounded-full text-xs text-white hover:text-[#e8d5b5]">
                Explore Atlas
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
