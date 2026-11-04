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
        <Compass className="w-12 h-12 text-[#94a3b8] mx-auto stroke-1" />
        <h2 className="font-editorial text-3xl font-bold text-white">Destination Not Found</h2>
        <p className="text-xs text-[#94a3b8]">The sanctuary you requested does not exist or has been archived.</p>
        <Link href="/destinations">
          <button className="glass-pill px-6 py-2.5 rounded-full text-xs text-white hover:text-[#e8d5b5]">
            Return to Atlas
          </button>
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#94a3b8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Atlas</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="glass-pill px-4 py-2 rounded-full text-xs font-semibold text-white hover:text-[#e8d5b5] flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <button
            onClick={handleToggleSave}
            className="glass-pill px-4 py-2 rounded-full text-xs font-semibold text-white hover:text-[#e8d5b5] flex items-center gap-1.5"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-[#e8d5b5] text-[#e8d5b5]" : ""}`} />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Cinematic Showcase Banner (Rule 2: Strictly Bounded Image Container) */}
      <div className="relative h-72 sm:h-96 md:h-[460px] w-full rounded-3xl overflow-hidden shadow-2xl glass-shell border border-white/15">
        <Image
          src={destination.image}
          alt={destination.name}
          fill
          priority
          sizes="100vw"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-[#050a10]/40 to-transparent" />

        <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 text-white flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-[#e8d5b5]">
                {destination.category}
              </span>
              <span className="text-xs text-white/60">•</span>
              <span className="text-xs text-white/80 font-medium">{destination.continent}</span>
            </div>

            <h1 className="font-editorial text-4xl sm:text-6xl font-bold tracking-tight">
              {destination.name}
            </h1>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#e8d5b5]">
              <MapPin className="w-4 h-4 text-[#38bdf8]" />
              <span>{destination.location}, {destination.country}</span>
            </div>
          </div>

          <div className="glass-pill px-4 py-2 rounded-2xl flex items-center gap-2 text-[#e8d5b5] font-bold text-sm shrink-0 border-white/20">
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
            <span className="editorial-tag text-[#e8d5b5]">Overview</span>
            <h2 className="font-editorial text-3xl font-bold text-white">
              The Character of {destination.name}
            </h2>
            <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed font-normal">
              {destination.description}
            </p>
          </div>

          {/* Highlights */}
          <div className="space-y-4">
            <span className="editorial-tag text-[#e8d5b5]">Curated Highlights</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {destination.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="p-4 rounded-2xl glass-card flex items-center gap-3 text-xs sm:text-sm font-medium text-white"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#38bdf8] shrink-0" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topographic & Regional Map */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="editorial-tag text-[#38bdf8]">Geographic Position</span>
              <span className="text-xs text-[#94a3b8] flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>{coords[0].toFixed(4)}° N, {coords[1].toFixed(4)}° E</span>
              </span>
            </div>
            <TripMap
              points={mapPoints}
              center={coords}
              zoom={11}
              className="h-[320px] sm:h-[380px] w-full rounded-3xl overflow-hidden border border-white/15 shadow-2xl"
            />
          </div>
        </div>

        {/* Right Column: Planning Action Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-dock p-6 rounded-3xl border border-white/20 shadow-2xl space-y-6 sticky top-28">
            <div className="space-y-3">
              <span className="editorial-tag text-[#e8d5b5]">Travel Specifications</span>
              <h3 className="font-editorial text-2xl font-bold text-white">
                At a Glance
              </h3>

              <div className="space-y-3 text-xs pt-1">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[#94a3b8] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
                    Suggested Duration
                  </span>
                  <span className="font-semibold text-white">{destination.recommendedDuration}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[#94a3b8] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#e8d5b5]" />
                    Estimated Budget
                  </span>
                  <span className="font-semibold text-white">{destination.approximateBudget}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[#94a3b8] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
                    Climate & Seasons
                  </span>
                  <span className="font-semibold text-white">Prime Window</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              <Link
                href={`/ai-planner?destination=${encodeURIComponent(destination.name + ', ' + destination.country)}`}
                className="w-full block"
              >
                <button className="w-full btn-luxe py-3.5 text-xs font-semibold gap-2 shadow-xl cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5 text-[#050a10]" />
                  <span>Synthesize AI Itinerary</span>
                </button>
              </Link>

              <Link
                href={`/manual-planner?destination=${encodeURIComponent(destination.name + ', ' + destination.country)}`}
                className="w-full block"
              >
                <button className="w-full glass-pill py-3.5 text-xs font-semibold text-white hover:text-[#e8d5b5] rounded-full flex items-center justify-center gap-1.5 cursor-pointer">
                  <span>Open Manual Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#e8d5b5]" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
