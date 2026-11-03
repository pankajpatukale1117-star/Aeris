"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import {
  MapPin,
  Star,
  Clock,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  Share2,
  Compass,
  ArrowRight,
  Navigation,
} from "lucide-react"
import { DESTINATIONS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useTravelStore } from "@/lib/store/travel-store"
import { TripMap, MapPoint } from "@/components/map/trip-map"

const DESTINATION_COORDINATES: Record<string, [number, number]> = {
  "santorini-greece": [36.3932, 25.4615],
  "kyoto-japan": [35.0116, 135.7681],
  "bali-indonesia": [-8.4095, 115.1889],
  "paris-france": [48.8566, 2.3522],
  "machu-picchu-peru": [-13.1631, -72.5450],
  "maldives": [3.2028, 73.2207],
  "iceland-aurora": [64.1466, -21.9426],
  "safari-kenya": [-1.2921, 36.8219],
  "amalfi-coast-italy": [40.6340, 14.6027],
  "new-york-city-usa": [40.7128, -74.0060],
  "bangkok-thailand": [13.7563, 100.5018],
  "new-zealand-south-island": [-45.0312, 168.6626],
  "patagonia-argentina": [-50.5000, -73.0000],
  "dubai-uae": [25.2048, 55.2708],
  "prague-czech-republic": [50.0755, 14.4378],
  "marrakech-morocco": [31.6295, -7.9811],
  "costa-rica": [9.7489, -83.7534],
  "swiss-alps": [46.5606, 7.9147],
  "rio-de-janeiro-brazil": [-22.9068, -43.1729],
  "singapore": [1.3521, 103.8198],
}

export default function DestinationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const destinationId = params?.id as string
  const destination = DESTINATIONS.find((d) => d.id === destinationId)

  const savedDestinationIds = useTravelStore((state) => state.savedDestinationIds)
  const toggleSaveDestination = useTravelStore((state) => state.toggleSaveDestination)

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!destination) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <Compass className="w-12 h-12 text-[#78848C] mx-auto stroke-1" />
        <h2 className="font-display text-2xl font-bold">Destination Not Found</h2>
        <p className="text-xs text-[#78848C]">The destination you requested does not exist or has been archived.</p>
        <Link href="/destinations">
          <Button variant="outline" className="rounded-full text-xs">Return to Atlas</Button>
        </Link>
      </div>
    )
  }

  const isSaved = mounted ? savedDestinationIds.includes(destination.id) : false

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({
        title: `${destination.name} — ROVEO`,
        text: destination.description,
        url: window.location.href,
      }).catch(() => {})
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Editorial link copied to your clipboard.",
      })
    }
  }

  const handleToggleSave = () => {
    const nowSaved = toggleSaveDestination(destination.id)
    toast({
      title: nowSaved ? "Saved to Travel Desk" : "Removed from Travel Desk",
      description: `${destination.name} is ${nowSaved ? "saved" : "removed"}.`,
    })
  }

  const coords = DESTINATION_COORDINATES[destination.id] || [35.0116, 135.7681]
  const mapPoints: MapPoint[] = [
    {
      id: destination.id,
      title: `${destination.name}, ${destination.country}`,
      lat: coords[0],
      lng: coords[1],
      category: destination.category,
    },
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Top Action Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78848C] hover:text-[#18232D] dark:hover:text-[#F8F7F4] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Atlas</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="rounded-full text-xs gap-1.5 border-black/10 dark:border-white/10"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSave}
            className="rounded-full text-xs gap-1.5 border-black/10 dark:border-white/10"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-[#6D9D94] text-[#6D9D94]" : ""}`} />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </Button>
        </div>
      </div>

      {/* Cinematic Showcase Banner */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-2xl bg-[#101E2B]">
        <Image
          src={destination.image}
          alt={destination.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101E2B] via-[#101E2B]/40 to-transparent" />

        <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 text-white flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-[#A5C7BA]">
                {destination.category}
              </span>
              <span className="text-xs text-white/60">•</span>
              <span className="text-xs text-white/80 font-medium">{destination.continent}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              {destination.name}
            </h1>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#A5C7BA]">
              <MapPin className="w-4 h-4" />
              <span>{destination.location}, {destination.country}</span>
            </div>
          </div>

          <div className="glass-pill px-4 py-2 rounded-2xl flex items-center gap-2 text-amber-300 font-bold text-sm shrink-0">
            <Star className="w-4 h-4 fill-current" />
            <span>{destination.rating} Rating</span>
          </div>
        </div>
      </div>

      {/* Main Editorial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Narrative, Highlights & Map */}
        <div className="lg:col-span-8 space-y-10">
          <div className="space-y-3">
            <span className="editorial-tag">Overview</span>
            <h2 className="font-display text-2xl font-bold text-[#18232D] dark:text-[#F8F7F4]">
              The Character of {destination.name}
            </h2>
            <p className="text-sm sm:text-base text-[#78848C] leading-relaxed font-normal">
              {destination.description}
            </p>
          </div>

          {/* Highlights */}
          <div className="space-y-4">
            <span className="editorial-tag">Curated Highlights</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {destination.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="p-4 rounded-2xl bg-card border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-3 text-xs sm:text-sm font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#6D9D94] shrink-0" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topographic & Regional Map */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="editorial-tag">Geographic Position</span>
              <span className="text-xs text-[#78848C] flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-[#6D9D94]" />
                <span>{coords[0].toFixed(4)}° N, {coords[1].toFixed(4)}° E</span>
              </span>
            </div>
            <TripMap
              points={mapPoints}
              center={coords}
              zoom={11}
              className="h-[320px] sm:h-[380px] w-full rounded-3xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08] shadow-sm"
            />
          </div>
        </div>

        {/* Right Column: Planning Action Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-dock p-6 rounded-3xl border shadow-lg space-y-6 sticky top-28">
            <div className="space-y-3">
              <span className="editorial-tag text-[#6D9D94]">Travel Specifications</span>
              <h3 className="font-display text-xl font-bold text-[#18232D] dark:text-[#F8F7F4]">
                At a Glance
              </h3>

              <div className="space-y-3 text-xs pt-1">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[#78848C] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#6D9D94]" />
                    Suggested Duration
                  </span>
                  <span className="font-semibold">{destination.recommendedDuration}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[#78848C] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#6D9D94]" />
                    Estimated Budget
                  </span>
                  <span className="font-semibold">{destination.approximateBudget}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[#78848C] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#6D9D94]" />
                    Climate & Seasons
                  </span>
                  <span className="font-semibold">Prime Window</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-2">
              <Link
                href={`/ai-planner?destination=${encodeURIComponent(destination.name + ', ' + destination.country)}`}
                className="w-full block"
              >
                <Button className="w-full rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] font-semibold py-6 text-xs gap-2 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-[#6D9D94] dark:text-[#101E2B]" />
                  <span>Synthesize AI Itinerary</span>
                </Button>
              </Link>

              <Link
                href={`/manual-planner?destination=${encodeURIComponent(destination.name + ', ' + destination.country)}`}
                className="w-full block"
              >
                <Button variant="outline" className="w-full rounded-full border-black/15 dark:border-white/20 py-6 text-xs font-semibold">
                  <span>Open Manual Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
