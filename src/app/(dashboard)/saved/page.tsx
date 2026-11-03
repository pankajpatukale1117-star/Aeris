"use client"

import * as React from "react"
import Link from "next/link"
import { Bookmark, Compass, Sparkles } from "lucide-react"
import { DESTINATIONS } from "@/lib/constants"
import { DestinationCard } from "@/components/destination/destination-card"
import { useTravelStore } from "@/lib/store/travel-store"

export default function SavedPage() {
  const savedDestinationIds = useTravelStore((state) => state.savedDestinationIds)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const savedList = React.useMemo(() => {
    if (!mounted) return []
    return DESTINATIONS.filter((d) => savedDestinationIds.includes(d.id))
  }, [mounted, savedDestinationIds])

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-16">
      {/* Editorial Header */}
      <div className="glass-shell p-8 sm:p-10 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#38bdf8]/10 via-[#e8d5b5]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 glass-pill px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#e8d5b5]">
            <Bookmark className="w-3 h-3 text-[#38bdf8]" />
            Personal Archive & Registry
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-medium tracking-tight text-[#f1f5f9]">
            Saved <span className="italic text-[#e8d5b5]">Destinations</span>{" "}
            <span className="text-2xl sm:text-3xl font-sans font-light text-slate-400">
              ({mounted ? savedList.length : "..."})
            </span>
          </h1>
          <p className="text-sm text-slate-300 max-w-xl font-light">
            Your private curation of global sanctuaries, sanctuaries, and cultural centers ready to be synthesized into bespoke expeditions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            href="/destinations"
            className="glass-pill px-5 py-3 text-xs font-medium text-slate-200 hover:text-white flex items-center gap-2 transition-all hover:border-[#38bdf8]/50"
          >
            <Compass className="w-4 h-4 text-[#38bdf8]" />
            <span>Discover More</span>
          </Link>

          <Link
            href="/ai-planner"
            className="btn-luxe px-6 py-3 rounded-full text-xs font-semibold flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plan Saved Trip</span>
          </Link>
        </div>
      </div>

      {/* Grid of Saved Destinations */}
      {savedList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {savedList.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              isSaved={true}
              variant="portrait"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-shell rounded-3xl border border-white/10 p-10 space-y-5 max-w-xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl glass-pill flex items-center justify-center mx-auto text-[#e8d5b5] shadow-inner">
            <Bookmark className="w-8 h-8 stroke-1 text-[#38bdf8]" />
          </div>
          <div className="space-y-2">
            <h3 className="font-editorial text-2xl sm:text-3xl text-white font-medium">Your Travel Archive is Empty</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Explore our verified global atlas and tap the golden bookmark emblem to curate destinations for future itineraries.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/destinations"
              className="btn-luxe px-8 py-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Explore the Atlas</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
