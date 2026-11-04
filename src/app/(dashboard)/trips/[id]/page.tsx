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
  Trash2,
  ArrowLeft,
  Sparkles,
  Navigation,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ItineraryTimeline } from "@/components/trip/itinerary-timeline"
import { calculateDurationFromTimes, calculateEndTimeFromDuration } from "@/components/trip/activity-card"
import { TripMap, MapPoint } from "@/components/map/trip-map"
import { useToast } from "@/hooks/use-toast"
import { useTravelStore, StoredTrip, StoredActivity } from "@/lib/store/travel-store"

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const tripId = params?.id as string

  const trips = useTravelStore((state) => state.trips)
  const deleteTrip = useTravelStore((state) => state.deleteTrip)
  const addDayToTrip = useTravelStore((state) => state.addDayToTrip)
  const addActivityToTrip = useTravelStore((state) => state.addActivityToTrip)
  const deleteActivityFromTrip = useTravelStore((state) => state.deleteActivityFromTrip)
  const updateTrip = useTravelStore((state) => state.updateTrip)

  const [mounted, setMounted] = React.useState(false)
  const [selectedDay, setSelectedDay] = React.useState(1)

  // Dialog state for adding a new activity
  const [isAddActivityOpen, setIsAddActivityOpen] = React.useState(false)
  const [targetDayNumber, setTargetDayNumber] = React.useState(1)
  const [actTitle, setActTitle] = React.useState("")
  const [actStartTime, setActStartTime] = React.useState("10:00")
  const [actEndTime, setActEndTime] = React.useState("11:30")
  const [actDesc, setActDesc] = React.useState("")
  const [actLocation, setActLocation] = React.useState("")
  const [actDuration, setActDuration] = React.useState("1.5h")
  const [actCost, setActCost] = React.useState("")
  const [actCategory, setActCategory] = React.useState("Sightseeing")

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = React.useState(false)
  const [notesDraft, setNotesDraft] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const trip = React.useMemo(() => {
    if (!mounted) return undefined
    return trips.find((t) => t.id === tripId)
  }, [mounted, trips, tripId])

  React.useEffect(() => {
    if (trip) {
      setNotesDraft(trip.notes || "")
    }
  }, [trip])

  if (!mounted) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-8 h-8 border-2 border-[#e8d5b5] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#94a3b8]">Opening journey blueprint...</p>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-[#94a3b8] mx-auto stroke-1" />
        <h2 className="font-editorial text-3xl font-bold text-white">Journey Not Found</h2>
        <p className="text-xs text-[#94a3b8]">
          The itinerary you are attempting to view may have been removed or has an incorrect ID.
        </p>
        <Link href="/trips">
          <button className="glass-pill px-6 py-2.5 rounded-full text-xs text-white hover:text-[#e8d5b5]">
            Return to Journeys
          </button>
        </Link>
      </div>
    )
  }

  // Generate map points from all activities in this trip
  const mapPoints: MapPoint[] = []
  trip.days.forEach((day) => {
    day.activities.forEach((act) => {
      if (act.lat && act.lng) {
        mapPoints.push({
          id: act.id,
          title: `${act.title} (${act.time})`,
          lat: act.lat,
          lng: act.lng,
          category: act.category,
        })
      }
    })
  })

  // If no activity points with lat/lng, provide fallback point from trip coordinates or destination
  const defaultCenter = trip.coordinates || [35.0116, 135.7681]
  if (mapPoints.length === 0) {
    mapPoints.push({
      id: "trip-center",
      title: trip.destination,
      lat: defaultCenter[0],
      lng: defaultCenter[1],
      category: "Destination",
    })
  }

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({
        title: `${trip.title} — ROVEO Itinerary`,
        text: `Check out my curated travel itinerary for ${trip.destination}`,
        url: window.location.href,
      }).catch(() => {})
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Shareable itinerary URL copied to your clipboard.",
      })
    }
  }

  const handleDeleteTrip = () => {
    if (confirm(`Are you sure you want to delete "${trip.title}"? This cannot be undone.`)) {
      deleteTrip(trip.id)
      toast({
        title: "Journey Deleted",
        description: `"${trip.title}" was removed from your archive.`,
      })
      router.push("/trips")
    }
  }

  const handleOpenAddActivity = (dayNumber: number) => {
    setTargetDayNumber(dayNumber)
    setIsAddActivityOpen(true)
  }

  const handleSaveNewActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!actTitle.trim()) return

    const formattedTime =
      actStartTime && actEndTime
        ? `${actStartTime} — ${actEndTime}`
        : actStartTime || actEndTime || "10:00"

    addActivityToTrip(trip.id, targetDayNumber, {
      time: formattedTime,
      startTime: actStartTime || "10:00",
      endTime: actEndTime || "11:30",
      title: actTitle,
      description: actDesc || "Curated experience.",
      location: actLocation || trip.destination,
      duration: actDuration,
      estimatedCost: actCost ? `$${actCost}` : "Free",
      category: actCategory,
    })

    setActTitle("")
    setActDesc("")
    setActLocation("")
    setActCost("")
    setActStartTime("10:00")
    setActEndTime("11:30")
    setIsAddActivityOpen(false)

    toast({
      title: "Experience Added",
      description: `Added "${actTitle}" to Day ${targetDayNumber}.`,
    })
  }

  const handleDeleteActivity = (dayNumber: number, activityId: string) => {
    deleteActivityFromTrip(trip.id, dayNumber, activityId)
    toast({
      title: "Experience Removed",
      description: "Activity deleted from this day's itinerary.",
    })
  }

  const handleAddDay = () => {
    const nextNum = trip.days.length + 1
    addDayToTrip(trip.id, `Day ${nextNum} Exploration`)
    setSelectedDay(nextNum)
    toast({
      title: `Day ${nextNum} Created`,
      description: "You can now add custom activities and reservations to this day.",
    })
  }

  const handleSaveNotes = () => {
    updateTrip(trip.id, { notes: notesDraft })
    setIsEditingNotes(false)
    toast({
      title: "Concierge Notes Updated",
      description: "Your trip notes have been persisted.",
    })
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* ─── 1. Top Navigation Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#94a3b8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Journeys</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="glass-pill px-4 py-2 rounded-full text-xs font-semibold text-white hover:text-[#e8d5b5] flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Share Itinerary</span>
          </button>

          <button
            onClick={handleDeleteTrip}
            className="glass-pill px-4 py-2 rounded-full text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1.5 cursor-pointer border-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Cinematic Showcase Banner (Rule 2: Strictly Bounded Image Container) ─── */}
      <div className="relative h-72 sm:h-96 md:h-[420px] w-full rounded-3xl overflow-hidden shadow-2xl glass-shell border border-white/15">
        <Image
          src={trip.coverImage || "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80"}
          alt={trip.title}
          fill
          priority
          sizes="100vw"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-[#050a10]/50 to-transparent" />

        <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 text-white flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-[#e8d5b5]">
                {trip.planningMode}
              </span>
              <span className="text-xs text-white/60">•</span>
              <span className="glass-pill px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#38bdf8] capitalize">
                {trip.status}
              </span>
            </div>

            <h1 className="font-editorial text-4xl sm:text-6xl font-bold tracking-tight">
              {trip.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#e8d5b5]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#38bdf8]" />
                <span>{trip.destination}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-white/90">
                <Calendar className="w-4 h-4 text-[#38bdf8]" />
                <span>{trip.dates}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-white/90">
                <Users className="w-4 h-4 text-[#38bdf8]" />
                <span>{trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}</span>
              </span>
            </div>
          </div>

          {/* Right Summary Badge */}
          {trip.budget && (
            <div className="glass-pill px-5 py-3 rounded-2xl flex flex-col items-end shrink-0 text-right border-white/20">
              <span className="text-[10px] uppercase tracking-wider text-[#e8d5b5] font-semibold">
                Estimated Budget
              </span>
              <span className="font-editorial text-3xl font-bold text-white">
                {trip.budget}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── 3. Main Workspace: Timeline + Map & Concierge Notes ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (8 cols): Day-by-Day Timeline */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="editorial-tag text-[#e8d5b5]">Master Timeline</span>
              <h2 className="font-editorial text-3xl font-bold text-white">
                Itinerary Schedule
              </h2>
            </div>

            <button
              onClick={handleAddDay}
              className="glass-pill px-4 py-2 rounded-full text-xs font-semibold text-white hover:text-[#e8d5b5] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Add Day</span>
            </button>
          </div>

          <ItineraryTimeline
            days={trip.days}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onAddActivity={handleOpenAddActivity}
            onDeleteActivity={handleDeleteActivity}
            editable={true}
          />
        </div>

        {/* Right Column (4 cols): Interactive Map & Concierge Desk ─────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Topographic Map */}
          <div className="glass-dock p-5 rounded-3xl border border-white/15 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="editorial-tag text-[#38bdf8]">Interactive Route</span>
              <span className="text-[11px] text-[#94a3b8]">
                {mapPoints.length} point{mapPoints.length > 1 ? "s" : ""} plotted
              </span>
            </div>

            <TripMap
              points={mapPoints}
              center={defaultCenter}
              zoom={12}
              className="h-[280px] w-full rounded-2xl overflow-hidden border border-white/10"
            />
          </div>

          {/* Concierge Notes & Reservations */}
          <div className="glass-dock p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="editorial-tag text-[#e8d5b5]">Concierge Notes</span>
              {!isEditingNotes ? (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs font-semibold text-[#38bdf8] hover:underline"
                >
                  Edit
                </button>
              ) : (
                <button
                  onClick={handleSaveNotes}
                  className="text-xs font-semibold text-[#e8d5b5] hover:underline"
                >
                  Save
                </button>
              )}
            </div>

            {!isEditingNotes ? (
              <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed whitespace-pre-line">
                {trip.notes || "No personal notes entered yet. Click 'Edit' to record reservation codes, tickets, or packing instructions."}
              </p>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Record confirmation numbers, ferry bookings, restaurant reservations..."
                  className="text-xs min-h-[100px] w-full rounded-2xl glass-input p-3"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setNotesDraft(trip.notes || "")
                      setIsEditingNotes(false)
                    }}
                    className="glass-pill px-4 py-1.5 text-xs text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="btn-luxe px-4 py-1.5 text-xs font-semibold"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 4. Add Activity Modal Dialog ─────────────────────────────────── */}
      <Dialog open={isAddActivityOpen} onOpenChange={setIsAddActivityOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 sm:p-8 glass-dock border border-white/20 shadow-2xl text-white">
          <DialogHeader className="space-y-1">
            <span className="editorial-tag text-[#e8d5b5]">Day {targetDayNumber}</span>
            <DialogTitle className="font-editorial text-3xl font-bold text-white">
              Add New Experience
            </DialogTitle>
            <DialogDescription className="text-xs text-[#94a3b8]">
              Schedule a visit, restaurant, reservation, or scenic detour.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewActivity} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="editorial-tag text-[9px] text-[#e8d5b5]">Title *</label>
              <input
                value={actTitle}
                onChange={(e) => setActTitle(e.target.value)}
                placeholder="e.g. Bamboo Grove Sunrise Walk"
                className="w-full glass-input rounded-2xl text-xs h-10 px-3.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="editorial-tag text-[9px] text-[#e8d5b5] flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-[#38bdf8]" />
                  Start Time *
                </label>
                <input
                  type="time"
                  value={actStartTime}
                  onChange={(e) => {
                    const val = e.target.value
                    setActStartTime(val)
                    if (val) {
                      setActEndTime(calculateEndTimeFromDuration(val, actDuration))
                    }
                  }}
                  className="w-full glass-input rounded-2xl text-xs h-10 px-3.5 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="editorial-tag text-[9px] text-[#e8d5b5] flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-[#34d399]" />
                  End Time *
                </label>
                <input
                  type="time"
                  value={actEndTime}
                  onChange={(e) => {
                    const val = e.target.value
                    setActEndTime(val)
                    if (actStartTime && val) {
                      const derived = calculateDurationFromTimes(actStartTime, val)
                      if (derived) setActDuration(derived)
                    }
                  }}
                  className="w-full glass-input rounded-2xl text-xs h-10 px-3.5 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="editorial-tag text-[9px] text-[#e8d5b5]">Duration</label>
                <input
                  value={actDuration}
                  onChange={(e) => {
                    const val = e.target.value
                    setActDuration(val)
                    if (actStartTime) {
                      const end = calculateEndTimeFromDuration(actStartTime, val)
                      if (end) setActEndTime(end)
                    }
                  }}
                  placeholder="e.g. 1.5h, 2h"
                  className="w-full glass-input rounded-2xl text-xs h-10 px-3.5 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="editorial-tag text-[9px] text-[#e8d5b5]">Location</label>
                <input
                  value={actLocation}
                  onChange={(e) => setActLocation(e.target.value)}
                  placeholder="e.g. Arashiyama District"
                  className="w-full glass-input rounded-2xl text-xs h-10 px-3.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="editorial-tag text-[9px] text-[#e8d5b5]">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={actCost}
                  onChange={(e) => setActCost(e.target.value)}
                  placeholder="0 for Free"
                  className="w-full glass-input rounded-2xl text-xs h-10 px-3.5 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="editorial-tag text-[9px] text-[#e8d5b5]">Category</label>
                <select
                  value={actCategory}
                  onChange={(e) => setActCategory(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-2xl glass-input text-xs cursor-pointer"
                >
                  <option value="Sightseeing" className="bg-[#050a10]">Sightseeing</option>
                  <option value="Dining" className="bg-[#050a10]">Dining / Food</option>
                  <option value="Culture" className="bg-[#050a10]">Culture & History</option>
                  <option value="Adventure" className="bg-[#050a10]">Adventure & Outdoor</option>
                  <option value="Stay" className="bg-[#050a10]">Accommodation / Stay</option>
                  <option value="Transit" className="bg-[#050a10]">Transportation</option>
                  <option value="Relaxation" className="bg-[#050a10]">Relaxation</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="editorial-tag text-[9px] text-[#e8d5b5]">Description / Concierge Details</label>
              <textarea
                value={actDesc}
                onChange={(e) => setActDesc(e.target.value)}
                placeholder="Details regarding reservations, best vantage points, or tickets..."
                className="w-full glass-input rounded-2xl text-xs min-h-[70px] p-3"
              />
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setIsAddActivityOpen(false)}
                className="glass-pill px-5 py-2 rounded-full text-xs text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-luxe px-6 py-2 rounded-full text-xs font-semibold"
              >
                Save Experience
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
