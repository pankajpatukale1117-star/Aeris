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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="space-y-1">
          <span className="editorial-tag">Custom Studio</span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
            Manual Trip Builder
          </h1>
          <p className="text-sm text-[#78848C]">
            Total autonomy over every hour, reservation, and expenditure.
          </p>
        </div>

        <Button
          onClick={handleSaveTrip}
          className="rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] font-semibold text-xs sm:text-sm px-6 py-5 shadow-sm gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Itinerary</span>
        </Button>
      </div>

      {/* Trip Master Details Form */}
      <div className="glass-dock p-6 rounded-3xl border shadow-sm space-y-4">
        <span className="editorial-tag">Trip Parameters</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1.5">
            <Label className="editorial-tag text-[9px] text-[#78848C]">Trip Title</Label>
            <Input
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              className="rounded-2xl h-10 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="editorial-tag text-[9px] text-[#78848C]">Destination</Label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="rounded-2xl h-10 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="editorial-tag text-[9px] text-[#78848C]">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-2xl h-10 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10 cursor-pointer"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="editorial-tag text-[9px] text-[#78848C]">Target Budget ($)</Label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="rounded-2xl h-10 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10"
            />
          </div>
        </div>
      </div>

      {/* Main Studio View: Day Navigator + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Day Manager */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="editorial-tag">Days ({days.length})</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddDay}
              className="rounded-full text-xs gap-1.5 border-black/10 dark:border-white/10"
            >
              <Plus className="w-3.5 h-3.5 text-[#6D9D94]" />
              <span>Add Day</span>
            </Button>
          </div>

          <div className="space-y-2">
            {days.map((day) => {
              const isSelected = day.dayNumber === activeDayNumber
              return (
                <div
                  key={day.dayNumber}
                  onClick={() => setActiveDayNumber(day.dayNumber)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-[#101E2B] dark:bg-[#A5C7BA] text-white dark:text-[#101E2B] border-transparent font-semibold shadow-sm"
                      : "bg-card border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.02] text-[#18232D] dark:text-[#F8F7F4]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center font-bold text-xs">
                      {day.dayNumber}
                    </span>
                    <div>
                      <p className="text-xs font-semibold leading-tight">{day.title}</p>
                      <span className="text-[10px] opacity-70 block mt-0.5">
                        {day.activities.length} activit{day.activities.length === 1 ? "y" : "ies"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Notes Card */}
          <div className="glass-dock p-4 rounded-2xl border shadow-sm space-y-2 text-xs">
            <Label className="editorial-tag text-[9px] text-[#78848C] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6D9D94]" />
              Personal Notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Packing reminders, tickets, reservations..."
              rows={3}
              className="text-xs rounded-xl bg-transparent border-black/10 dark:border-white/10"
            />
          </div>
        </div>

        {/* Right Columns: Day Activities Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-dock p-6 sm:p-8 rounded-3xl border shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <span className="editorial-tag text-[#6D9D94]">Day {activeDay.dayNumber} Focus</span>
                <h3 className="font-display text-2xl font-bold text-[#18232D] dark:text-[#F8F7F4]">
                  {activeDay.title}
                </h3>
              </div>

              <Button
                size="sm"
                onClick={() => setIsAddingActivity(!isAddingActivity)}
                className="rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] text-xs gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingActivity ? "Cancel" : "Add Activity"}</span>
              </Button>
            </div>

            {/* Add Activity Inline Form */}
            {isAddingActivity && (
              <form
                onSubmit={handleSaveActivity}
                className="bg-black/[0.02] dark:bg-white/[0.03] p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] space-y-3.5"
              >
                <h4 className="editorial-tag text-[9px] text-[#6D9D94]">
                  Add Experience to Day {activeDay.dayNumber}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="editorial-tag text-[9px] text-[#78848C]">Time (e.g. 09:30 AM)</Label>
                    <Input
                      value={newActTime}
                      onChange={(e) => setNewActTime(e.target.value)}
                      placeholder="09:30 AM"
                      className="rounded-xl h-9 text-xs bg-transparent"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="editorial-tag text-[9px] text-[#78848C]">Activity Title *</Label>
                    <Input
                      value={newActTitle}
                      onChange={(e) => setNewActTitle(e.target.value)}
                      placeholder="e.g. Sentiero degli Dei Trek"
                      className="rounded-xl h-9 text-xs bg-transparent"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="editorial-tag text-[9px] text-[#78848C]">Location</Label>
                    <Input
                      value={newActLoc}
                      onChange={(e) => setNewActLoc(e.target.value)}
                      placeholder="e.g. Bomerano Summit"
                      className="rounded-xl h-9 text-xs bg-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="editorial-tag text-[9px] text-[#78848C]">Estimated Cost</Label>
                    <Input
                      value={newActCost}
                      onChange={(e) => setNewActCost(e.target.value)}
                      placeholder="e.g. 25 or Free"
                      className="rounded-xl h-9 text-xs bg-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="editorial-tag text-[9px] text-[#78848C]">Description & Context</Label>
                  <Textarea
                    value={newActDesc}
                    onChange={(e) => setNewActDesc(e.target.value)}
                    placeholder="Details, reservation code, or walking notes..."
                    rows={2}
                    className="rounded-xl text-xs bg-transparent"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingActivity(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] text-white dark:text-[#101E2B] text-xs px-5"
                  >
                    Save Experience
                  </Button>
                </div>
              </form>
            )}

            {/* Activities List */}
            <div className="space-y-3 relative pl-6 sm:pl-8 border-l-2 border-[#6D9D94]/30 ml-3 sm:ml-4 pt-2">
              {activeDay.activities.map((act) => (
                <div key={act.id} className="relative">
                  <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full bg-background border-2 border-[#6D9D94]" />
                  <ActivityCard
                    activity={act}
                    editable={true}
                    onDelete={handleDeleteActivity}
                  />
                </div>
              ))}

              {activeDay.activities.length === 0 && !isAddingActivity && (
                <div className="py-16 text-center text-xs text-[#78848C] space-y-3">
                  <p>No experiences planned for Day {activeDay.dayNumber} yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingActivity(true)}
                    className="rounded-full text-xs"
                  >
                    + Add First Activity
                  </Button>
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
    <React.Suspense fallback={<div className="py-24 text-center text-xs text-[#78848C]">Loading Manual Studio...</div>}>
      <ManualPlannerContent />
    </React.Suspense>
  )
}
