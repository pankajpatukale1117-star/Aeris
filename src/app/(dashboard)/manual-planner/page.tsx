"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Save,
  Clock,
  DollarSign,
  ArrowRight,
  Sliders,
  CheckCircle2,
  FileText,
} from "lucide-react"
import { ActivityCard, ActivityItem } from "@/components/trip/activity-card"
import { useToast } from "@/hooks/use-toast"
import { useTravelStore, StoredTrip } from "@/lib/store/travel-store"
import { DESTINATIONS } from "@/lib/constants"

interface ManualDay {
  dayNumber: number
  title: string
  activities: ActivityItem[]
}

function ManualPlannerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const addTrip = useTravelStore((state) => state.addTrip)

  const prefillDestination = searchParams.get("destination") || "Amalfi Coast, Italy"

  // Trip Header Form
  const [tripTitle, setTripTitle] = React.useState("Custom Mediterranean Getaway")
  const [destination, setDestination] = React.useState(prefillDestination)
  const [startDate, setStartDate] = React.useState("2026-09-10")
  const [endDate, setEndDate] = React.useState("2026-09-17")
  const [budget, setBudget] = React.useState("3000")
  const [notes, setNotes] = React.useState("Remember to book ferry between Positano and Capri.")

  // Days and activities
  const [days, setDays] = React.useState<ManualDay[]>([
    {
      dayNumber: 1,
      title: "Arrival & Coastal Check-in",
      activities: [
        {
          id: "m-1",
          time: "14:00",
          title: "Check into Cliffside Villa",
          description: "Unpack and take in the panoramic views of the Tyrrhenian Sea.",
          location: "Positano",
          duration: "1h",
          estimatedCost: "$350",
          category: "Stay",
        },
        {
          id: "m-2",
          time: "18:00",
          title: "Sunset Aperitivo at Franco's Bar",
          description: "Enjoy chilled Prosecco and local olives overlooking the colorful hillside.",
          location: "Positano Village",
          duration: "1.5h",
          estimatedCost: "$40",
          category: "Dining",
        },
      ],
    },
    {
      dayNumber: 2,
      title: "Path of the Gods Hike",
      activities: [
        {
          id: "m-3",
          time: "08:30",
          title: "Sentiero degli Dei Trek",
          description: "Breathtaking coastal hiking trail high above the sea between Bomerano and Nocelle.",
          location: "Bomerano",
          duration: "3.5h",
          estimatedCost: "Free",
          category: "Adventure",
        },
      ],
    },
  ])

  const [activeDayNumber, setActiveDayNumber] = React.useState(1)

  // New activity form state
  const [newActTime, setNewActTime] = React.useState("10:00")
  const [newActTitle, setNewActTitle] = React.useState("")
  const [newActDesc, setNewActDesc] = React.useState("")
  const [newActLoc, setNewActLoc] = React.useState("")
  const [newActCost, setNewActCost] = React.useState("")
  const [newActCat, setNewActCat] = React.useState("Sightseeing")
  const [isAddingActivity, setIsAddingActivity] = React.useState(false)

  const activeDay = days.find((d) => d.dayNumber === activeDayNumber) || days[0]

  const handleAddDay = () => {
    const nextDayNum = days.length + 1
    setDays((prev) => [
      ...prev,
      {
        dayNumber: nextDayNum,
        title: `Day ${nextDayNum} Itinerary`,
        activities: [],
      },
    ])
    setActiveDayNumber(nextDayNum)
    toast({
      title: `Day ${nextDayNum} Added`,
      description: "You can now add custom activities for this day.",
    })
  }

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newActTitle.trim()) return

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      time: newActTime,
      title: newActTitle,
      description: newActDesc,
      location: newActLoc,
      estimatedCost: newActCost ? `$${newActCost}` : "Free",
      category: newActCat,
    }

    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDayNumber
          ? { ...d, activities: [...d.activities, newActivity] }
          : d
      )
    )

    setNewActTitle("")
    setNewActDesc("")
    setNewActLoc("")
    setNewActCost("")
    setIsAddingActivity(false)

    toast({
      title: "Activity Saved",
      description: `"${newActivity.title}" added to Day ${activeDayNumber}.`,
    })
  }

  const handleDeleteActivity = (activityId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDayNumber
          ? { ...d, activities: d.activities.filter((a) => a.id !== activityId) }
          : d
      )
    )
    toast({
      title: "Activity Removed",
      description: "Activity deleted from your itinerary.",
    })
  }

  const handleSaveTrip = () => {
    const matchedDest = DESTINATIONS.find(
      (d) =>
        d.name.toLowerCase() === destination.toLowerCase() ||
        destination.toLowerCase().includes(d.name.toLowerCase())
    )
    const coverImage = matchedDest
      ? matchedDest.image
      : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80"

    const newTripId = `trip-${Date.now()}`
    const newTrip: StoredTrip = {
      id: newTripId,
      title: tripTitle || `Journey to ${destination}`,
      destination: destination,
      dates: `${startDate} — ${endDate}`,
      startDate: startDate,
      endDate: endDate,
      daysCount: days.length,
      travelers: 2,
      budget: budget ? `$${budget}` : undefined,
      status: "planning",
      planningMode: "Manual Studio",
      coverImage: coverImage,
      notes: notes,
      coordinates: [40.6340, 14.6027],
      days: days.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        activities: d.activities.map((a) => ({
          id: a.id,
          time: a.time,
          title: a.title,
          description: a.description,
          location: a.location,
          duration: a.duration,
          estimatedCost: a.estimatedCost,
          category: a.category,
        })),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addTrip(newTrip)
    toast({
      title: "Journey Created & Saved",
      description: `"${newTrip.title}" has been saved to your travel archive.`,
    })
    router.push(`/trips/${newTrip.id}`)
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
        <div className="space-y-1">
          <span className="editorial-tag text-[#e8d5b5]">Custom Studio</span>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#f1f5f9]">
            Manual Trip Builder
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Total autonomy over every hour, reservation, and expenditure.
          </p>
        </div>

        <button
          onClick={handleSaveTrip}
          className="btn-luxe px-6 py-3 text-xs sm:text-sm font-semibold gap-2 shadow-xl cursor-pointer"
        >
          <Save className="w-4 h-4 text-[#050a10]" />
          <span>Save Itinerary</span>
        </button>
      </div>

      {/* Trip Master Details Form */}
      <div className="glass-shell p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
        <span className="editorial-tag text-[#e8d5b5]">Trip Parameters</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="editorial-tag text-[9px] text-[#e8d5b5]">Trip Title</label>
            <input
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              className="w-full glass-input rounded-2xl h-10 px-3 text-xs sm:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="editorial-tag text-[9px] text-[#e8d5b5]">Destination</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full glass-input rounded-2xl h-10 px-3 text-xs sm:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="editorial-tag text-[9px] text-[#e8d5b5]">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full glass-input rounded-2xl h-10 px-3 text-xs sm:text-sm cursor-pointer"
            />
          </div>
          <div className="space-y-1.5">
            <label className="editorial-tag text-[9px] text-[#e8d5b5]">Target Budget ($)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full glass-input rounded-2xl h-10 px-3 text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Studio View: Day Navigator + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Day Manager */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="editorial-tag text-[#38bdf8]">Days ({days.length})</span>
            <button
              onClick={handleAddDay}
              className="glass-pill px-3 py-1.5 rounded-full text-xs font-semibold text-white hover:text-[#e8d5b5] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Add Day</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {days.map((day) => {
              const isSelected = day.dayNumber === activeDayNumber
              return (
                <div
                  key={day.dayNumber}
                  onClick={() => setActiveDayNumber(day.dayNumber)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "glass-pill active border-[#e8d5b5] shadow-[0_0_15px_rgba(232,213,181,0.25)]"
                      : "glass-card hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-[#e8d5b5]">
                      {day.dayNumber}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white leading-tight">{day.title}</p>
                      <span className="text-[10px] text-[#94a3b8] block mt-0.5">
                        {day.activities.length} activit{day.activities.length === 1 ? "y" : "ies"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Notes Card */}
          <div className="glass-dock p-4 rounded-2xl border border-white/15 shadow-lg space-y-2 text-xs">
            <label className="editorial-tag text-[9px] text-[#e8d5b5] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
              Personal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Packing reminders, tickets, reservations..."
              rows={3}
              className="w-full glass-input rounded-xl p-3 text-xs"
            />
          </div>
        </div>

        {/* Right Columns: Day Activities Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-shell p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div>
                <span className="editorial-tag text-[#38bdf8]">Day {activeDay.dayNumber} Focus</span>
                <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-white">
                  {activeDay.title}
                </h3>
              </div>

              {!isAddingActivity && (
                <button
                  onClick={() => setIsAddingActivity(true)}
                  className="btn-luxe px-4 py-2 text-xs font-semibold gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 text-[#050a10]" />
                  <span>Add Experience</span>
                </button>
              )}
            </div>

            {/* Add Activity Inline Form */}
            {isAddingActivity && (
              <form onSubmit={handleSaveActivity} className="p-5 rounded-2xl glass-dock border border-white/20 space-y-4">
                <span className="editorial-tag text-[#e8d5b5]">New Experience Entry</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="editorial-tag text-[8px] text-[#94a3b8]">Time</label>
                    <input
                      type="time"
                      value={newActTime}
                      onChange={(e) => setNewActTime(e.target.value)}
                      className="w-full glass-input rounded-xl h-9 px-3 text-xs"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="editorial-tag text-[8px] text-[#94a3b8]">Title *</label>
                    <input
                      value={newActTitle}
                      onChange={(e) => setNewActTitle(e.target.value)}
                      placeholder="e.g. Positano Boat Charter"
                      className="w-full glass-input rounded-xl h-9 px-3 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="editorial-tag text-[8px] text-[#94a3b8]">Location</label>
                    <input
                      value={newActLoc}
                      onChange={(e) => setNewActLoc(e.target.value)}
                      placeholder="e.g. Positano Port"
                      className="w-full glass-input rounded-xl h-9 px-3 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="editorial-tag text-[8px] text-[#94a3b8]">Est. Cost ($)</label>
                    <input
                      type="number"
                      value={newActCost}
                      onChange={(e) => setNewActCost(e.target.value)}
                      placeholder="0 for Free"
                      className="w-full glass-input rounded-xl h-9 px-3 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="editorial-tag text-[8px] text-[#94a3b8]">Description</label>
                  <textarea
                    value={newActDesc}
                    onChange={(e) => setNewActDesc(e.target.value)}
                    placeholder="Details, reservation confirmation codes..."
                    rows={2}
                    className="w-full glass-input rounded-xl p-3 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingActivity(false)}
                    className="glass-pill px-4 py-1.5 text-xs text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-luxe px-5 py-1.5 text-xs font-semibold"
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            )}

            {/* Activities List */}
            <div className="space-y-3">
              {activeDay.activities.map((act) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  onDelete={handleDeleteActivity}
                  editable={true}
                />
              ))}

              {activeDay.activities.length === 0 && !isAddingActivity && (
                <div className="text-center py-12 glass-card rounded-2xl border border-white/10 space-y-2">
                  <Clock className="w-8 h-8 text-[#94a3b8] mx-auto stroke-1" />
                  <p className="text-xs text-[#94a3b8]">No activities planned for {activeDay.title}.</p>
                  <button
                    onClick={() => setIsAddingActivity(true)}
                    className="glass-pill px-4 py-1.5 text-xs text-[#e8d5b5] hover:text-white rounded-full cursor-pointer"
                  >
                    + Add Experience
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ManualPlannerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#e8d5b5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#94a3b8]">Opening manual builder...</p>
        </div>
      }
    >
      <ManualPlannerContent />
    </React.Suspense>
  )
}
