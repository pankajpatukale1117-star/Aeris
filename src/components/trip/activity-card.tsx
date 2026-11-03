"use client"

import * as React from "react"
import { Clock, MapPin, DollarSign, Trash2 } from "lucide-react"

export interface ActivityItem {
  id: string
  time: string
  title: string
  description: string
  duration?: string
  location?: string
  estimatedCost?: string
  category?: string
  isBooked?: boolean
}

interface ActivityCardProps {
  activity: ActivityItem
  onDelete?: (id: string) => void
  editable?: boolean
}

export function ActivityCard({ activity, onDelete, editable = false }: ActivityCardProps) {
  return (
    <div className="group relative glass-card p-5 rounded-2xl border border-white/12 shadow-lg transition-all duration-300 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-[#e8d5b5] glass-pill px-2.5 py-0.5 rounded-full">
            {activity.time}
          </span>
          {activity.category && (
            <span className="editorial-tag text-[9px] text-[#38bdf8] glass-pill px-2 py-0.5 rounded-full">
              {activity.category}
            </span>
          )}
        </div>

        {editable && onDelete && (
          <button
            onClick={() => onDelete(activity.id)}
            className="text-[#94a3b8] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
            title="Remove experience"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <h4 className="font-editorial font-bold text-xl text-white leading-snug">
        {activity.title}
      </h4>

      <p className="text-xs text-[#94a3b8] leading-relaxed">
        {activity.description}
      </p>

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

        {activity.estimatedCost && (
          <span className="font-semibold text-[#e8d5b5] flex items-center gap-0.5">
            <DollarSign className="w-3 h-3 text-[#38bdf8]" />
            <span>{activity.estimatedCost}</span>
          </span>
        )}
      </div>
    </div>
  )
}
