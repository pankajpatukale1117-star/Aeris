"use client"

import * as React from "react"
import { Clock, MapPin, Trash2, Pencil, ArrowUp, ArrowDown } from "lucide-react"

export interface ActivityItem {
  id: string
  time: string
  title: string
  description: string
  duration?: string
  location?: string
  estimatedCost?: string | number
  cost?: number
  category?: string
  isBooked?: boolean
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
          <span className="text-[11px] font-mono font-bold text-[#e8d5b5] glass-pill px-2.5 py-0.5 rounded-full">
            {activity.time}
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
