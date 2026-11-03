"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { ActivityCard, ActivityItem } from "./activity-card"

export interface ItineraryDay {
  dayNumber: number
  date?: string
  title: string
  description?: string
  activities: ActivityItem[]
}

interface ItineraryTimelineProps {
  days: ItineraryDay[]
  selectedDay?: number
  onSelectDay?: (day: number) => void
  onAddActivity?: (dayNumber: number) => void
  onDeleteActivity?: (dayNumber: number, activityId: string) => void
  editable?: boolean
}

export function ItineraryTimeline({
  days,
  selectedDay = 1,
  onSelectDay,
  onAddActivity,
  onDeleteActivity,
  editable = false,
}: ItineraryTimelineProps) {
  const currentDayData = days.find((d) => d.dayNumber === selectedDay) || days[0]

  return (
    <div className="space-y-8">
      {/* Editorial Day Selector Pills Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {days.map((day) => {
          const isSelected = day.dayNumber === selectedDay
          return (
            <button
              key={day.dayNumber}
              onClick={() => onSelectDay && onSelectDay(day.dayNumber)}
              className={`flex flex-col items-center justify-center min-w-[84px] py-2.5 px-4 rounded-2xl glass-pill text-xs transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "active font-bold text-white shadow-[0_0_20px_rgba(232,213,181,0.25)] border-[#e8d5b5]"
                  : "text-[#94a3b8]"
              }`}
            >
              <span className="editorial-tag text-[8px] text-[#e8d5b5]">
                Day {day.dayNumber}
              </span>
              <span className="text-xs font-semibold truncate max-w-[75px] mt-0.5 text-white">
                {day.date || `Part ${day.dayNumber}`}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Day View */}
      {currentDayData && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 rounded-3xl glass-dock border border-white/15">
            <div>
              <span className="editorial-tag text-[#38bdf8] block">
                Day {currentDayData.dayNumber} Itinerary
              </span>
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-white">
                {currentDayData.title}
              </h3>
              {currentDayData.description && (
                <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                  {currentDayData.description}
                </p>
              )}
            </div>

            {editable && onAddActivity && (
              <button
                onClick={() => onAddActivity(currentDayData.dayNumber)}
                className="btn-luxe px-4 py-2 text-xs font-semibold gap-1.5 shrink-0 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5 text-[#050a10]" />
                <span>Add Experience</span>
              </button>
            )}
          </div>

          {/* Activities list with delicate timeline rail */}
          <div className="space-y-4 relative pl-6 sm:pl-8 border-l-2 border-[#e8d5b5]/30 ml-3 sm:ml-4">
            {currentDayData.activities.map((act) => (
              <div key={act.id} className="relative">
                {/* Node Dot on Timeline with Liquid Glow */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-5 w-3.5 h-3.5 rounded-full bg-[#050a10] border-2 border-[#e8d5b5] shadow-[0_0_8px_#e8d5b5]" />
                <ActivityCard
                  activity={act}
                  onDelete={
                    onDeleteActivity
                      ? (id) => onDeleteActivity(currentDayData.dayNumber, id)
                      : undefined
                  }
                  editable={editable}
                />
              </div>
            ))}

            {currentDayData.activities.length === 0 && (
              <div className="p-6 rounded-2xl glass-card text-center space-y-2">
                <p className="text-xs text-[#94a3b8]">No activities planned for Day {currentDayData.dayNumber} yet.</p>
                {editable && onAddActivity && (
                  <button
                    onClick={() => onAddActivity(currentDayData.dayNumber)}
                    className="glass-pill px-4 py-1.5 text-xs text-[#e8d5b5] hover:text-white rounded-full cursor-pointer"
                  >
                    + Add your first experience
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
