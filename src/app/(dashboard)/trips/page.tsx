"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  PlusCircle,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Trash2,
  Compass,
} from "lucide-react"
import { useTravelStore, StoredTrip } from "@/lib/store/travel-store"
import { useToast } from "@/hooks/use-toast"

export default function TripsPage() {
  const { toast } = useToast()
  const trips = useTravelStore((state) => state.trips)
  const deleteTrip = useTravelStore((state) => state.deleteTrip)

  const [mounted, setMounted] = React.useState(false)
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "planning" | "completed">("all")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const filteredTrips = React.useMemo(() => {
    if (!mounted) return []
    return trips.filter((t) => {
      if (filter === "all") return true
      return t.status === filter
    })
  }, [mounted, trips, filter])

  const handleDeleteTrip = (e: React.MouseEvent, tripId: string, tripTitle: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete "${tripTitle}"? This cannot be undone.`)) {
      deleteTrip(tripId)
      toast({
        title: "Journey Deleted",
        description: `"${tripTitle}" has been removed from your archive.`,
      })
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
        <div className="space-y-1">
          <span className="editorial-tag text-[#e8d5b5]">Your Archive</span>
          <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f1f5f9]">
            Saved Journeys ({mounted ? filteredTrips.length : "..."})
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Review, edit, and relive your personalized itineraries with liquid precision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/ai-planner">
            <button className="btn-luxe px-5 py-2.5 text-xs font-semibold gap-2 shadow-lg cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-[#050a10]" />
              <span>AI Concierge</span>
            </button>
          </Link>

          <Link href="/manual-planner">
            <button className="glass-pill px-5 py-2.5 text-xs font-semibold text-white hover:text-[#e8d5b5] rounded-full gap-2 flex items-center cursor-pointer">
              <PlusCircle className="w-3.5 h-3.5 text-[#e8d5b5]" />
              <span>Manual Builder</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-4 text-xs">
        {(["all", "upcoming", "planning", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`glass-pill px-4 py-1.5 rounded-full capitalize text-xs font-medium tracking-wide transition-all cursor-pointer ${
              filter === tab
                ? "active font-bold text-white shadow-[0_0_15px_rgba(232,213,181,0.25)]"
                : "text-[#94a3b8]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTrips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="group glass-card rounded-3xl overflow-hidden border border-white/15 shadow-xl transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Strict Image Containment Container (Rule 2) */}
                <div className="relative h-56 sm:h-60 w-full overflow-hidden">
                  <Image
                    src={trip.coverImage || "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80"}
                    alt={trip.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-black/30 to-transparent" />

                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <span className="glass-pill text-[10px] font-bold uppercase tracking-wider text-[#e8d5b5] px-3 py-1 rounded-full">
                      {trip.planningMode}
                    </span>

                    <button
                      onClick={(e) => handleDeleteTrip(e, trip.id, trip.title)}
                      className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-white/80 hover:text-red-400 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Journey"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Destination on bottom of image */}
                  <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                    <div className="flex items-center gap-1.5 text-xs text-[#38bdf8] font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{trip.destination}</span>
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="editorial-tag text-[9px] text-[#e8d5b5] capitalize">
                      Status: {trip.status}
                    </span>
                    {trip.budget && (
                      <span className="text-xs font-semibold text-white">
                        {trip.budget}
                      </span>
                    )}
                  </div>

                  <h3 className="font-editorial font-bold text-2xl text-white leading-snug group-hover:text-[#e8d5b5] transition-colors">
                    {trip.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-[#94a3b8] pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>{trip.dates}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#e8d5b5]" />
                      <span>{trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="px-6 pb-6 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold text-[#e8d5b5]">
                <span>Explore Full Itinerary ({trip.days?.length || trip.daysCount} days)</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-[#38bdf8]" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-dock rounded-3xl border border-white/15 p-8 space-y-4 max-w-md mx-auto">
          <Compass className="w-12 h-12 text-[#94a3b8] mx-auto stroke-1" />
          <h3 className="font-editorial text-3xl font-bold text-white">No Journeys Found</h3>
          <p className="text-xs text-[#94a3b8]">
            {filter === "all"
              ? "You haven't planned any trips yet. Generate an itinerary with AI or build your own custom schedule."
              : `You have no trips currently under "${filter}".`}
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link href="/ai-planner">
              <button className="btn-luxe px-5 py-2.5 text-xs font-semibold cursor-pointer">
                AI Studio
              </button>
            </Link>
            <Link href="/manual-planner">
              <button className="glass-pill px-5 py-2.5 text-xs text-white hover:text-[#e8d5b5] rounded-full cursor-pointer">
                Manual Builder
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
