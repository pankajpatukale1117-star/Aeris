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
    <div className="group relative glass-dock p-5 rounded-2xl border shadow-sm transition-all duration-300 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-[#101E2B] dark:text-[#A5C7BA] bg-black/[0.04] dark:bg-white/[0.08] px-2.5 py-0.5 rounded-full">
            {activity.time}
          </span>
          {activity.category && (
            <span className="editorial-tag text-[9px] text-[#6D9D94] glass-pill px-2 py-0.5 rounded-full">
              {activity.category}
            </span>
          )}
        </div>

        {editable && onDelete && (
          <button
            onClick={() => onDelete(activity.id)}
            className="text-[#78848C] hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
            title="Remove experience"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <h4 className="font-display font-bold text-base text-[#18232D] dark:text-[#F8F7F4] leading-snug">
        {activity.title}
      </h4>

      <p className="text-xs text-[#78848C] leading-relaxed">
        {activity.description}
      </p>

      <div className="pt-2.5 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#78848C]">
        <div className="flex items-center gap-3">
          {activity.location && (
            <span className="flex items-center gap-1 text-[#6D9D94]">
              <MapPin className="w-3 h-3" />
              <span>{activity.location}</span>
            </span>
          )}
          {activity.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{activity.duration}</span>
            </span>
          )}
        </div>

        {activity.estimatedCost && (
          <span className="font-semibold text-[#18232D] dark:text-[#F8F7F4] flex items-center gap-0.5">
            <DollarSign className="w-3 h-3 text-[#6D9D94]" />
            <span>{activity.estimatedCost}</span>
          </span>
        )}
      </div>
    </div>
  )
}
