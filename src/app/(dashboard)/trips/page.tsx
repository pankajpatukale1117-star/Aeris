"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { PlusCircle, Calendar, MapPin, Users, Sparkles, ArrowRight, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const SAMPLE_TRIPS = [
  {
    id: "trip-kyoto-2026",
    title: "Autumn Serenity in Kyoto",
    destination: "Kyoto, Japan",
    dates: "Nov 15 — Nov 22, 2026",
    daysCount: 7,
    travelers: 2,
    status: "upcoming",
    planningMode: "AI Architecture",
    coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    budget: "$2,200",
  },
  {
    id: "trip-santorini-2027",
    title: "Cyclades Island Hopping",
    destination: "Santorini & Milos, Greece",
    dates: "May 10 — May 18, 2027",
    daysCount: 8,
    travelers: 2,
    status: "planning",
    planningMode: "Manual Studio",
    coverImage: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
    budget: "$3,400",
  },
  {
    id: "trip-swiss-2025",
    title: "Alpine Adventure in Bernese Oberland",
    destination: "Swiss Alps, Switzerland",
    dates: "Jul 05 — Jul 12, 2025",
    daysCount: 7,
    travelers: 4,
    status: "completed",
    planningMode: "AI Architecture",
    coverImage: "https://images.unsplash.com/photo-1531210483974-4f8c1f33fd35?w=800&q=80",
    budget: "$4,800",
  },
]

export default function TripsPage() {
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "planning" | "completed">("all")

  const filteredTrips = SAMPLE_TRIPS.filter((t) => {
    if (filter === "all") return true
    return t.status === filter
  })

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="space-y-1">
          <span className="editorial-tag">Your Archive</span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
            Saved Journeys
          </h1>
          <p className="text-sm text-[#78848C]">
            Review, edit, and relive your personalized itineraries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/ai-planner">
            <Button className="rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] text-xs font-semibold px-5 py-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-2 text-[#6D9D94] dark:text-[#101E2B]" />
              <span>AI Studio</span>
            </Button>
          </Link>

          <Link href="/manual-planner">
            <Button variant="outline" className="rounded-full border-black/15 dark:border-white/20 text-xs font-semibold px-5 py-5">
              <PlusCircle className="w-3.5 h-3.5 mr-2" />
              <span>Manual Builder</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-black/[0.06] dark:border-white/[0.06] pb-3 text-xs">
        {(["all", "upcoming", "planning", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full capitalize text-xs font-medium tracking-wide transition-all ${
              filter === tab
                ? "bg-[#101E2B] dark:bg-[#A5C7BA] text-white dark:text-[#101E2B] font-semibold shadow-sm"
                : "text-[#78848C] hover:text-[#18232D] dark:hover:text-[#F8F7F4]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Editorial Journeys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTrips.map((trip) => (
          <Link
            key={trip.id}
            href={`/trips/${trip.id}`}
            className="group relative block rounded-3xl overflow-hidden bg-[#101E2B] text-white shadow-xl transition-all duration-700 hover:shadow-2xl"
          >
            <div className="relative aspect-[16/11] w-full overflow-hidden">
              <Image
                src={trip.coverImage}
                alt={trip.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101E2B] via-[#101E2B]/40 to-transparent" />

              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-white">
                  {trip.status}
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#A5C7BA] glass-pill px-2.5 py-0.5 rounded-full">
                  {trip.planningMode}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#A5C7BA] font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{trip.destination}</span>
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight text-white group-hover:text-[#A5C7BA] transition-colors leading-snug">
                  {trip.title}
                </h3>
              </div>
            </div>

            <div className="p-5 flex flex-col justify-between gap-3 text-xs bg-[#101E2B] border-t border-white/[0.08]">
              <div className="grid grid-cols-2 gap-2 text-white/70">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#6D9D94]" />
                  <span>{trip.dates}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Users className="w-3.5 h-3.5 text-[#6D9D94]" />
                  <span>{trip.travelers} Guests</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="editorial-tag text-[9px] text-[#78848C]">
                    Budget Allocation
                  </span>
                  <span className="font-bold text-white text-sm block">{trip.budget}</span>
                </div>

                <span className="inline-flex items-center gap-1 text-[#A5C7BA] font-semibold text-xs group-hover:translate-x-1 transition-transform">
                  <span>Open Itinerary</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
