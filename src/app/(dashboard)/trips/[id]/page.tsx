"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Share2,
  Edit3,
  ArrowLeft,
  Sparkles,
  Navigation,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ItineraryTimeline, ItineraryDay } from "@/components/trip/itinerary-timeline"
import { TripMap, MapPoint } from "@/components/map/trip-map"
import { useToast } from "@/hooks/use-toast"

const SAMPLE_TRIP_DETAILS = {
  id: "trip-kyoto-2026",
  title: "Autumn Serenity in Kyoto",
  destination: "Kyoto, Japan",
  dates: "Nov 15 — Nov 22, 2026",
  daysCount: 7,
  travelers: 2,
  budget: "$2,200",
  budgetSpent: "$1,680",
  planningMode: "AI Architecture",
  coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80",
  notes: "Pre-book bullet train passes (Shinkansen) from Tokyo. Reserve morning tea ceremony in Uji.",
  coordinates: [35.0116, 135.7681] as [number, number],
}

const SAMPLE_DAYS: ItineraryDay[] = [
  {
    dayNumber: 1,
    date: "Nov 15",
    title: "Arrival & Gion Lanterns",
    description: "Settle into your traditional machiya, followed by an evening stroll through the lantern-lit alleys of Gion.",
    activities: [
      {
        id: "act-1",
        time: "14:00",
        title: "Check-in at Ryokan Gion Sano",
        description: "Historic traditional Japanese inn with private tatami garden.",
        location: "Gion District",
        duration: "1h",
        estimatedCost: "$220",
        category: "Stay",
      },
      {
        id: "act-2",
        time: "17:30",
        title: "Sunset Walk along Shirakawa Canal",
        description: "Stone bridges, willow trees, and preserved geisha tea houses.",
        location: "Shirakawa Canal",
        duration: "1.5h",
        estimatedCost: "Free",
        category: "Sightseeing",
      },
      {
        id: "act-3",
        time: "19:30",
        title: "Kaiseki Dinner at Gion Karyo",
        description: "Multi-course seasonal Kyoto cuisine paired with local junmai sake.",
        location: "Gion",
        duration: "2h",
        estimatedCost: "$120",
        category: "Dining",
      },
    ],
  },
  {
    dayNumber: 2,
    date: "Nov 16",
    title: "Arashiyama Bamboo & River",
    description: "Early morning amidst bamboo stalks, followed by Zen temple exploration and a scenic riverboat journey.",
    activities: [
      {
        id: "act-4",
        time: "07:30",
        title: "Arashiyama Bamboo Grove Walk",
        description: "Beat the crowds to experience the peaceful wind whistling through towering green bamboo stalks.",
        location: "Arashiyama",
        duration: "1.5h",
        estimatedCost: "Free",
        category: "Nature",
      },
      {
        id: "act-5",
        time: "09:30",
        title: "Tenryu-ji Zen Temple Gardens",
        description: "UNESCO World Heritage site with a 14th-century landscape garden.",
        location: "Ukyo Ward",
        duration: "1.5h",
        estimatedCost: "$5",
        category: "Culture",
      },
      {
        id: "act-6",
        time: "13:00",
        title: "Tofu Lunch at Yudofu Sagano",
        description: "Kyoto's legendary simmered tofu hot pot in a peaceful courtyard setting.",
        location: "Saga Tenryuji",
        duration: "1h",
        estimatedCost: "$35",
        category: "Dining",
      },
    ],
  },
  {
    dayNumber: 3,
    date: "Nov 17",
    title: "Torii Gates of Fushimi Inari",
    description: "Hike through 10,000 crimson torii gates winding up Mount Inari.",
    activities: [
      {
        id: "act-7",
        time: "08:00",
        title: "Fushimi Inari Shrine Summit Trek",
        description: "Hike up Mount Inari through thousand vermilion torii gates dedicated to the Shinto god of rice and foxes.",
        location: "Fushimi Ward",
        duration: "2.5h",
        estimatedCost: "Free",
        category: "Historical",
      },
      {
        id: "act-8",
        time: "12:30",
        title: "Sake Tasting in Fushimi District",
        description: "Sample pure spring water brewed sake across three century-old breweries.",
        location: "Fushimi Riverfront",
        duration: "2h",
        estimatedCost: "$40",
        category: "Culinary",
      },
    ],
  },
]

const MAP_POINTS: MapPoint[] = [
  { id: "p1", title: "Gion District", lat: 35.0037, lng: 135.7772, category: "Cultural" },
  { id: "p2", title: "Arashiyama Bamboo Grove", lat: 35.017, lng: 135.6713, category: "Nature" },
  { id: "p3", title: "Tenryu-ji Temple", lat: 35.0158, lng: 135.6776, category: "Heritage" },
  { id: "p4", title: "Fushimi Inari Taisha", lat: 34.9671, lng: 135.7727, category: "Shrine" },
]

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [selectedDay, setSelectedDay] = React.useState(1)
  const [days, setDays] = React.useState<ItineraryDay[]>(SAMPLE_DAYS)

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: SAMPLE_TRIP_DETAILS.title,
        text: `ROVEO Travel Plan: ${SAMPLE_TRIP_DETAILS.title}`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Itinerary link copied!",
        description: "Share this link with your travel partners.",
      })
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Top Action Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78848C] hover:text-[#18232D] dark:hover:text-[#F8F7F4] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Journeys</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="rounded-full text-xs gap-1.5 border-black/10 dark:border-white/10"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Plan</span>
          </Button>

          <Link href="/manual-planner">
            <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5 border-black/10 dark:border-white/10">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modify</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Cinematic Showcase Banner */}
      <div className="relative aspect-[16/7] md:aspect-[21/8] w-full rounded-3xl overflow-hidden shadow-2xl bg-[#101E2B]">
        <Image
          src={SAMPLE_TRIP_DETAILS.coverImage}
          alt={SAMPLE_TRIP_DETAILS.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101E2B] via-[#101E2B]/40 to-transparent" />

        <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 sm:right-8 text-white flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-[#A5C7BA]">
                {SAMPLE_TRIP_DETAILS.planningMode}
              </span>
              <span className="text-xs text-white/60">•</span>
              <span className="text-xs text-white/80 font-medium">{SAMPLE_TRIP_DETAILS.daysCount} Days</span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {SAMPLE_TRIP_DETAILS.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-white/80 pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#A5C7BA]" />
                {SAMPLE_TRIP_DETAILS.destination}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#A5C7BA]" />
                {SAMPLE_TRIP_DETAILS.dates}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#A5C7BA]" />
                {SAMPLE_TRIP_DETAILS.travelers} Guests
              </span>
            </div>
          </div>

          <div className="glass-pill px-4 py-3 rounded-2xl text-xs space-y-1 shrink-0">
            <span className="editorial-tag text-[9px] text-[#A5C7BA] block">
              Budget Status
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-white">
                {SAMPLE_TRIP_DETAILS.budgetSpent}
              </span>
              <span className="text-white/60">/ {SAMPLE_TRIP_DETAILS.budget}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Timeline + Map Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <ItineraryTimeline
            days={days}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            editable={true}
          />
        </div>

        {/* Right Column: Interactive Map & Notes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Map Preview */}
          <div className="glass-dock p-4 rounded-3xl border shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-semibold flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#6D9D94]" />
                Topographic Route
              </span>
              <span className="text-[10px] text-[#78848C]">OpenStreetMap</span>
            </div>
            <TripMap points={MAP_POINTS} center={SAMPLE_TRIP_DETAILS.coordinates} zoom={11} />
          </div>

          {/* Notes Box */}
          <div className="glass-dock p-5 rounded-3xl border shadow-sm space-y-2">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-[#18232D] dark:text-[#F8F7F4] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6D9D94]" />
              Concierge & Travel Notes
            </h4>
            <p className="text-xs text-[#78848C] leading-relaxed">
              {SAMPLE_TRIP_DETAILS.notes}
            </p>
          </div>

          {/* Quick AI Refine CTA */}
          <div className="rounded-3xl bg-[#101E2B] text-white p-6 shadow-xl border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#A5C7BA] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#6D9D94]" />
              Conversational Refinement
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Want to adjust pacing, shift dates, or add off-the-beaten-path recommendations? Chat with the AI travel studio.
            </p>
            <Link href="/ai-planner" className="block pt-1">
              <Button size="sm" className="w-full rounded-full bg-[#F8F7F4] hover:bg-white text-[#101E2B] text-xs font-semibold">
                Refine with AI Studio →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
