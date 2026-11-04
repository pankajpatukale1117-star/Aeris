"use client"

import * as React from "react"
import { Clock, MapPin, Trash2, Pencil, ArrowUp, ArrowDown } from "lucide-react"

export interface ActivityItem {
  id: string
  time: string
  startTime?: string
  endTime?: string
  title: string
  description: string
  duration?: string
  location?: string
  estimatedCost?: string | number
  cost?: number
  category?: string
  isBooked?: boolean
}

// Calculate duration string (e.g. "1.5h", "2h", "45m") from start and end times
export function calculateDurationFromTimes(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return ""
  try {
    const [startH, startM] = startTime.split(":").map(Number)
    const [endH, endM] = endTime.split(":").map(Number)
    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM)
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60 // wrap around midnight
    }
    if (diffMinutes <= 0) return ""
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    if (minutes === 0) return `${hours}h`
    if (hours === 0) return `${minutes}m`
    const decimal = Math.round((diffMinutes / 60) * 10) / 10
    return `${decimal}h`
  } catch {
    return ""
  }
}

// Calculate endTime ("15:30") from startTime ("14:00") and duration string ("1.5h")
export function calculateEndTimeFromDuration(startTime: string, durationStr: string): string {
  if (!startTime) return ""
  try {
    const [startH, startM] = startTime.split(":").map(Number)
    let addMinutes = 90 // default 1.5h
    const lower = (durationStr || "1.5h").toLowerCase().trim()
    if (lower.includes("half day")) {
      addMinutes = 4 * 60
    } else if (lower.includes("full day")) {
      addMinutes = 8 * 60
    } else {
      const matchH = lower.match(/([0-9.]+)\s*h/)
      const matchM = lower.match(/([0-9.]+)\s*m/)
      if (matchH) {
        addMinutes = Math.round(parseFloat(matchH[1]) * 60)
      } else if (matchM) {
        addMinutes = Math.round(parseFloat(matchM[1]))
      } else {
        const num = parseFloat(lower)
        if (!isNaN(num)) addMinutes = Math.round(num * 60)
      }
    }
    const totalMinutes = (startH * 60 + startM + addMinutes) % (24 * 60)
    const endH = Math.floor(totalMinutes / 60)
    const endM = totalMinutes % 60
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
  } catch {
    return ""
  }
}

export interface ActivityCardProps {
  activity: ActivityItem
  onDelete?: (id: string) => void
  onEdit?: (activity: ActivityItem) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  currencySymbol?: string
  editable?: boolean
}

export function ActivityCard({
  activity,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  currencySymbol = "$",
  editable = false,
}: ActivityCardProps) {
  // Format start & end time range cleanly
  const displayTime = React.useMemo(() => {
    if (activity.startTime && activity.endTime) {
      return `${activity.startTime} — ${activity.endTime}`
    }
    if (activity.startTime) {
      return activity.startTime
    }
    return activity.time || "10:00"
  }, [activity.startTime, activity.endTime, activity.time])

  // Format cost safely without double currency signs ($ $350 -> $350 / {symbol}350)
  const formattedCost = React.useMemo(() => {
    if (activity.estimatedCost === undefined || activity.estimatedCost === null || activity.estimatedCost === "") {
      return null
    }
    const raw = String(activity.estimatedCost).trim()
    if (raw.toLowerCase() === "free" || raw === "0") return "Free"
    const cleaned = raw.replace(/[^0-9.]/g, "")
    const num = Number(cleaned)
    if (isNaN(num)) return raw
    return `${currencySymbol}${num.toLocaleString()}`
  }, [activity.estimatedCost, currencySymbol])

  return (
    <div className="group relative glass-card p-5 rounded-2xl border border-white/12 shadow-lg transition-all duration-300 space-y-2.5 hover:border-[#38bdf8]/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono font-bold text-[#e8d5b5] glass-pill px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3 h-3 text-[#38bdf8]" />
            <span>{displayTime}</span>
          </span>
          {activity.category && (
            <span className="editorial-tag text-[9px] text-[#38bdf8] glass-pill px-2 py-0.5 rounded-full uppercase tracking-wider">
              {activity.category}
            </span>
          )}
        </div>

        {editable && (
          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {onMoveUp && (
              <button
                type="button"
                onClick={() => onMoveUp(activity.id)}
                disabled={!canMoveUp}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Move earlier"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={() => onMoveDown(activity.id)}
                disabled={!canMoveDown}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Move later"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(activity)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#e8d5b5] hover:bg-white/10 transition-all cursor-pointer"
                title="Edit experience"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(activity.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                title="Remove experience"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <h4 className="font-editorial font-bold text-xl text-white leading-snug">
        {activity.title}
      </h4>

      {activity.description && (
        <p className="text-xs text-[#94a3b8] leading-relaxed">
          {activity.description}
        </p>
      )}

      <div className="pt-2.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94a3b8]">
        <div className="flex items-center gap-3">
          {activity.location && (
            <span className="flex items-center gap-1 text-[#38bdf8]">
              <MapPin className="w-3 h-3" />
              <span>{activity.location}</span>
            </span>
          )}
          {activity.duration && (
            <span className="flex items-center gap-1 text-[#94a3b8]">
              <Clock className="w-3 h-3 text-[#e8d5b5]" />
              <span>{activity.duration}</span>
            </span>
          )}
        </div>

        {formattedCost && (
          <span className="font-semibold text-[#e8d5b5] font-mono text-xs">
            {formattedCost}
          </span>
        )}
      </div>
    </div>
  )
}
