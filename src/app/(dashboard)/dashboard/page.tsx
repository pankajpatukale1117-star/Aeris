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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DESTINATIONS } from "@/lib/constants"
import { DestinationCard } from "@/components/destination/destination-card"

export default function DashboardPage() {
  const user = {
    name: "Alexandra",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    tier: "Passport Member",
    upcomingTripsCount: 2,
    savedPlacesCount: 7,
  }

  const activeJourney = {
    id: "trip-kyoto-2026",
    title: "Autumn Serenity in Kyoto",
    destination: "Kyoto, Japan",
    dates: "Nov 15 — Nov 22, 2026",
    daysCount: 7,
    status: "Upcoming",
    planningMode: "AI Architecture",
    coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
    progressPercent: 85,
    summary: "Machiya stay in historic Gion, dawn bamboo walks, and Zen garden meditation circuits.",
  }

  const savedHighlights = DESTINATIONS.slice(0, 3)

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* ─── 1. Editorial Welcome & Traveler Status ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border border-black/10 dark:border-white/20 shrink-0 shadow-sm">
            <Image
              src={user.avatar}
              alt={user.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-0.5">
            <span className="editorial-tag text-[#6D9D94]">
              {user.tier} • Active Travel Desk
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
              Welcome back, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#78848C]">
              Your journey. Your rules. Your world.
            </p>
          </div>
        </div>

        {/* Dual Planning Shortcuts */}
        <div className="flex items-center gap-3">
          <Link href="/ai-planner">
            <Button className="rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] text-xs font-semibold px-5 py-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-2 text-[#6D9D94] dark:text-[#101E2B]" />
              <span>AI Trip Studio</span>
            </Button>
          </Link>

          <Link href="/manual-planner">
            <Button
              variant="outline"
              className="rounded-full border-black/15 dark:border-white/20 text-xs font-semibold px-5 py-5 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-2 text-[#78848C]" />
              <span>Manual Builder</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── 2. Spotlight: Active Upcoming Journey ─────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="editorial-tag">Next Departure</span>
          <Link
            href="/trips"
            className="text-xs font-semibold text-[#6D9D94] hover:text-[#101E2B] dark:hover:text-[#F8F7F4] transition-colors"
          >
            All Saved Journeys ({user.upcomingTripsCount}) →
          </Link>
        </div>

        {/* Cinematic Journey Spotlight Card */}
        <Link
          href={`/trips/${activeJourney.id}`}
          className="group block relative rounded-3xl overflow-hidden bg-[#101E2B] text-white shadow-xl transition-all duration-500 hover:shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
            {/* Image Canvas */}
            <div className="md:col-span-5 relative aspect-[16/10] md:aspect-auto w-full min-h-[260px] overflow-hidden">
              <Image
                src={activeJourney.coverImage}
                alt={activeJourney.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#101E2B] via-transparent to-transparent opacity-80" />
            </div>

            {/* Details Panel */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-[#A5C7BA]">
                    {activeJourney.status}
                  </span>
                  <span className="text-xs text-white/50">•</span>
                  <span className="text-xs text-white/70 font-medium">{activeJourney.planningMode}</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-[#A5C7BA] transition-colors">
                  {activeJourney.title}
                </h3>

                <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
                  {activeJourney.summary}
                </p>
              </div>

              {/* Progress & Metadata */}
              <div className="pt-4 border-t border-white/[0.1] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#A5C7BA]" />
                    {activeJourney.dates}
                  </span>
                  <span className="font-semibold text-[#A5C7BA] flex items-center gap-1">
                    <span>Itinerary Blueprint Ready</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ─── 3. Saved Destinations: Thematic Visual Strip ─────────────────── */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="editorial-tag">Wishlist</span>
            <h2 className="font-display text-2xl font-bold text-[#18232D] dark:text-[#F8F7F4]">
              Saved Destinations
            </h2>
          </div>
          <Link
            href="/saved"
            className="text-xs font-semibold text-[#6D9D94] hover:text-[#101E2B] dark:hover:text-[#F8F7F4] transition-colors"
          >
            View All Saved ({user.savedPlacesCount}) →
          </Link>
        </div>

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
      </div>
    </div>
  )
}
