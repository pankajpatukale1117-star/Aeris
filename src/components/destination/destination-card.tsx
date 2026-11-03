"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Bookmark, Star, MapPin } from "lucide-react"
import { Destination } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { useTravelStore } from "@/lib/store/travel-store"

interface DestinationCardProps {
  destination: Destination
  onSave?: (id: string) => void
  isSaved?: boolean
  variant?: "portrait" | "landscape" | "spotlight"
}

export function DestinationCard({
  destination,
  onSave,
  isSaved: propSaved,
  variant = "portrait",
}: DestinationCardProps) {
  const { toast } = useToast()
  const savedDestinationIds = useTravelStore((state) => state.savedDestinationIds)
  const toggleSaveDestination = useTravelStore((state) => state.toggleSaveDestination)

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isSaved = mounted
    ? savedDestinationIds.includes(destination.id)
    : propSaved ?? false

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const nowSaved = toggleSaveDestination(destination.id)
    if (onSave) onSave(destination.id)

    toast({
      title: nowSaved ? "Saved to your Travel Desk" : "Removed from Travel Desk",
      description: `${destination.name}, ${destination.country} is ${nowSaved ? "saved" : "removed"}.`,
    })
  }

  return (
    <Link
      href={`/destinations/${destination.id}`}
      className="group relative block rounded-3xl overflow-hidden glass-card transition-all duration-500 hover:shadow-2xl"
    >
      {/* Strict Image Containment Container: Bounded relative h-56 w-full overflow-hidden */}
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={destination.image}
          alt={destination.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />

        {/* Liquid Glass Overlay Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-[#050a10]/40 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

        {/* Top Controls: Glass Pill Category + Bookmark */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="glass-pill text-[10px] uppercase tracking-[0.2em] font-semibold px-3 py-1 rounded-full text-white/90 drop-shadow-sm">
            {destination.category}
          </span>

          <button
            onClick={handleToggleSave}
            className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-white/90 hover:text-white hover:scale-110 transition-all duration-300"
            aria-label="Save destination"
          >
            <Bookmark
              className={`w-4 h-4 transition-colors ${
                isSaved ? "fill-[#e8d5b5] text-[#e8d5b5]" : "text-white"
              }`}
            />
          </button>
        </div>

        {/* Bottom Information Block */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-[#f1f5f9] z-10 space-y-2">
          {/* Location Subtitle */}
          <div className="flex items-center gap-1.5 text-xs text-[#e8d5b5] font-medium tracking-wide">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{destination.location}, {destination.country}</span>
          </div>

          {/* Editorial Heading */}
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-[#e8d5b5] transition-colors duration-300 truncate">
              {destination.name}
            </h3>

            <div className="flex items-center gap-1 text-xs text-[#e8d5b5] font-semibold shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{destination.rating}</span>
            </div>
          </div>

          {/* Description Snippet */}
          <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed font-light">
            {destination.description}
          </p>

          {/* Bottom Telemetry Bar: Fixed Un-squished Duration & Budget Row */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between w-full text-xs font-medium">
            <span className="text-[#38bdf8] font-medium tracking-wide">{destination.recommendedDuration}</span>
            <span className="text-white font-semibold tracking-wide">{destination.approximateBudget}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
