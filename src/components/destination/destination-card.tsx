"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Bookmark, Star, MapPin, ArrowUpRight } from "lucide-react"
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

  const aspectClass =
    variant === "spotlight"
      ? "aspect-[16/11] sm:aspect-[16/10]"
      : variant === "landscape"
      ? "aspect-[16/10]"
      : "aspect-[4/5]"

  return (
    <Link
      href={`/destinations/${destination.id}`}
      className="group relative block rounded-3xl overflow-hidden bg-[#101E2B] transition-all duration-700 hover:shadow-2xl hover:shadow-[#101E2B]/15"
    >
      {/* Editorial Image Canvas */}
      <div className={`relative ${aspectClass} w-full overflow-hidden`}>
        <Image
          src={destination.image}
          alt={destination.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
        />

        {/* Editorial Film Vignette & Multi-step Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101E2B] via-[#101E2B]/30 to-black/10 transition-opacity duration-500 group-hover:opacity-90" />

        {/* Top Controls: Category tag & Minimalist Bookmark */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="glass-pill text-[10px] uppercase tracking-[0.2em] font-semibold px-3 py-1 rounded-full text-white drop-shadow-sm">
            {destination.category}
          </span>

          <button
            onClick={handleToggleSave}
            className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-white/90 hover:text-white hover:scale-110 transition-all duration-300"
            aria-label="Save destination"
          >
            <Bookmark
              className={`w-4 h-4 transition-colors ${
                isSaved ? "fill-[#A5C7BA] text-[#A5C7BA]" : "text-white"
              }`}
            />
          </button>
        </div>

        {/* Bottom Editorial Information Block */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-[#F8F7F4] z-10 space-y-2">
          {/* Location Subtitle */}
          <div className="flex items-center gap-1.5 text-xs text-[#A5C7BA] font-medium tracking-wide">
            <MapPin className="w-3.5 h-3.5" />
            <span>{destination.location}, {destination.country}</span>
          </div>

          {/* Heading */}
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-2xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-[#A5C7BA] transition-colors duration-300">
              {destination.name}
            </h3>

            <div className="flex items-center gap-1 text-xs text-amber-300/90 font-medium shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{destination.rating}</span>
            </div>
          </div>

          {/* Highlights summary */}
          <p className="text-xs text-[#F8F7F4]/75 line-clamp-2 leading-relaxed">
            {destination.description}
          </p>

          {/* Bottom Bar: Duration & Budget */}
          <div className="pt-3 border-t border-white/[0.1] flex items-center justify-between text-[11px] text-[#A5C7BA] font-medium">
            <span>{destination.recommendedDuration}</span>
            <span className="text-white/90 font-semibold">{destination.approximateBudget}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
