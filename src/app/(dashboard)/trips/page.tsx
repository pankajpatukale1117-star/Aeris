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
import { Button } from "@/components/ui/button"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="space-y-1">
          <span className="editorial-tag">Your Archive</span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
            Saved Journeys ({mounted ? filteredTrips.length : "..."})
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

      {/* Trips Grid */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTrips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="group glass-dock rounded-3xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08] shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Cover Image Canvas */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#101E2B]">
                  <Image
                    src={trip.coverImage || "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80"}
                    alt={trip.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="glass-pill text-[10px] font-bold uppercase tracking-wider text-white px-3 py-1 rounded-full">
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
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-1.5 text-xs text-[#A5C7BA] font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{trip.destination}</span>
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="editorial-tag text-[9px] text-[#6D9D94] capitalize">
                      Status: {trip.status}
                    </span>
                    {trip.budget && (
                      <span className="text-xs font-semibold text-[#18232D] dark:text-[#F8F7F4]">
                        {trip.budget}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-xl text-[#18232D] dark:text-[#F8F7F4] leading-snug group-hover:text-[#6D9D94] transition-colors">
                    {trip.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-[#78848C] pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{trip.dates}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="px-6 pb-6 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs font-semibold text-[#6D9D94]">
                <span>Explore Full Itinerary ({trip.days?.length || trip.daysCount} days)</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-dock rounded-3xl border border-black/[0.08] dark:border-white/[0.08] p-8 space-y-4 max-w-md mx-auto">
          <Compass className="w-12 h-12 text-[#78848C] mx-auto stroke-1" />
          <h3 className="font-display text-2xl font-bold">No Journeys Found</h3>
          <p className="text-xs text-[#78848C]">
            {filter === "all"
              ? "You haven't planned any trips yet. Generate an itinerary with AI or build your own custom schedule."
              : `You have no trips currently under "${filter}".`}
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link href="/ai-planner">
              <Button className="rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] text-white dark:text-[#101E2B] text-xs px-5">
                AI Studio
              </Button>
            </Link>
            <Link href="/manual-planner">
              <Button variant="outline" className="rounded-full text-xs px-5">
                Manual Builder
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
