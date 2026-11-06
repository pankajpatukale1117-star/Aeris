"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  Clock,
  MapPin,
  Trash2,
  Pencil,
  CheckCircle2,
  Bookmark,
  CalendarCheck,
  ArrowRightLeft,
  Navigation,
  ExternalLink,
} from "lucide-react"
import { ActivityItem } from "@/components/trip/activity-card"
import { TransitEstimate } from "@/lib/planner/route-optimizer"

interface SortableActivityCardProps {
  activity: ActivityItem
  index: number
  allDayNumbers: number[]
  currentDayNumber: number
  currencySymbol?: string
  transitToNext?: TransitEstimate | null
  onDelete: (id: string) => void
  onEdit: (activity: ActivityItem) => void
  onToggleBooking: (id: string, nextStatus: "wishlist" | "reserved" | "booked") => void
  onMoveToDay: (activityId: string, targetDayNumber: number) => void
}

export function SortableActivityCard({
  activity,
  index,
  allDayNumbers,
  currentDayNumber,
  currencySymbol = "$",
  transitToNext,
  onDelete,
  onEdit,
  onToggleBooking,
  onMoveToDay,
}: SortableActivityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.6 : 1,
  }

  const [isMoveMenuOpen, setIsMoveMenuOpen] = React.useState(false)

  // Booking status progression: wishlist -> reserved -> booked -> wishlist
  const bookingStatus: "wishlist" | "reserved" | "booked" =
    activity.bookingStatus || (activity.isBooked ? "booked" : "wishlist")

  const handleNextStatus = () => {
    let next: "wishlist" | "reserved" | "booked" = "wishlist"
    if (bookingStatus === "wishlist") next = "reserved"
    else if (bookingStatus === "reserved") next = "booked"
    else next = "wishlist"
    onToggleBooking(activity.id, next)
  }

  // Display time
  const displayTime = activity.startTime && activity.endTime
    ? `${activity.startTime} — ${activity.endTime}`
    : activity.startTime || activity.time || "Scheduled"

  // Cost formatting
  const formattedCost = React.useMemo(() => {
    if (!activity.estimatedCost || activity.estimatedCost === "0" || String(activity.estimatedCost).toLowerCase() === "free") {
      return "Free"
    }
    const clean = String(activity.estimatedCost).replace(/[^0-9.]/g, "")
    return clean ? `${currencySymbol}${clean}` : "Free"
  }, [activity.estimatedCost, currencySymbol])

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      {/* ─── Main Activity Card ─────────────────────────────────────────── */}
      <div className={`group relative glass-card p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
        isDragging
          ? "border-[#38bdf8] shadow-[0_0_25px_rgba(56,189,248,0.4)] bg-[#050a10]"
          : "border-white/12 hover:border-[#38bdf8]/40 shadow-lg"
      }`}>
        <div className="flex items-start justify-between gap-3">
          {/* Left: Drag Handle + Time + Badges */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* DnD Grip Handle */}
            <button
              {...attributes}
              {...listeners}
              type="button"
              className="p-1 rounded-lg text-slate-500 hover:text-white cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors -ml-1 shrink-0"
              title="Drag to reorder stop"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            {/* Sequence Number */}
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-[#e8d5b5] shrink-0">
              {index + 1}
            </span>

            {/* Time Pill */}
            <span className="text-[11px] font-mono font-bold text-[#e8d5b5] glass-pill px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm shrink-0">
              <Clock className="w-3 h-3 text-[#38bdf8]" />
              <span>{displayTime}</span>
            </span>

            {/* Category Badge */}
            {activity.category && (
              <span className="editorial-tag text-[9px] text-[#38bdf8] glass-pill px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                {activity.category}
              </span>
            )}

            {/* Duration Badge */}
            {activity.duration && (
              <span className="text-[10px] font-mono text-slate-400 glass-pill px-2 py-0.5 rounded-full shrink-0">
                {activity.duration}
              </span>
            )}

            {/* Booking State Toggle Pill (Requirement 7) */}
            <button
              type="button"
              onClick={handleNextStatus}
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                bookingStatus === "booked"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                  : bookingStatus === "reserved"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:border-white/20"
              }`}
              title="Click to advance status: Wishlist → Reserved → Booked"
            >
              {bookingStatus === "booked" && <CheckCircle2 className="w-2.5 h-2.5" />}
              {bookingStatus === "reserved" && <CalendarCheck className="w-2.5 h-2.5" />}
              {bookingStatus === "wishlist" && <Bookmark className="w-2.5 h-2.5" />}
              <span className="capitalize">{bookingStatus}</span>
            </button>
          </div>

          {/* Right: Cost & Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              formattedCost === "Free"
                ? "bg-white/5 text-slate-300 border-white/10"
                : "bg-[#e8d5b5]/10 text-[#e8d5b5] border-[#e8d5b5]/30 shadow-sm"
            }`}>
              {formattedCost}
            </span>

            {/* Move to another day dropdown button */}
            {allDayNumbers.length > 1 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMoveMenuOpen(!isMoveMenuOpen)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#38bdf8] hover:bg-white/5 transition-colors cursor-pointer"
                  title="Move stop to another day"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>

                {isMoveMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl glass-dock border border-white/20 shadow-2xl p-1.5 z-50 animate-reveal bg-[#050a10]">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider px-2 py-1 font-semibold border-b border-white/10">
                      Move to:
                    </div>
                    {allDayNumbers
                      .filter((d) => d !== currentDayNumber)
                      .map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            onMoveToDay(activity.id, d)
                            setIsMoveMenuOpen(false)
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                        >
                          Day {d}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => onEdit(activity)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Edit experience details"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => onDelete(activity.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Delete experience"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Location */}
        <div className="space-y-1 pt-1 pl-6 sm:pl-7">
          <h4 className="font-editorial text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {activity.title}
          </h4>

          {activity.location && (
            <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
              <MapPin className="w-3 h-3 text-[#38bdf8] shrink-0" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  activity.title + " " + activity.location
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-[#38bdf8] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                title="Open location on Google Maps"
              >
                <span>{activity.location}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60 inline" />
              </a>
            </div>
          )}

          {activity.description && (
            <p className="text-xs text-slate-400 leading-relaxed pt-0.5 font-light">
              {activity.description}
            </p>
          )}
        </div>
      </div>

      {/* ─── Transit Buffer Between Stops (Requirement 5) ─────────────────── */}
      {transitToNext && (
        <div className="pl-8 sm:pl-10 pr-4 py-1 flex items-center gap-2 text-[11px] font-mono">
          <div className="w-[1.5px] h-4 bg-white/20 ml-2" />
          <span className={`px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
            transitToNext.isLongDistance
              ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
              : "glass-pill text-slate-400 border-white/10"
          }`}>
            <Navigation className="w-2.5 h-2.5 text-[#38bdf8]" />
            <span>{transitToNext.label}</span>
          </span>
        </div>
      )}
    </div>
  )
}

