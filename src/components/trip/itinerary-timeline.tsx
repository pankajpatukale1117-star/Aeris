"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { ActivityCard, ActivityItem } from "./activity-card"
import { Button } from "@/components/ui/button"

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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {days.map((day) => {
          const isSelected = day.dayNumber === selectedDay
          return (
            <button
              key={day.dayNumber}
              onClick={() => onSelectDay && onSelectDay(day.dayNumber)}
              className={`flex flex-col items-center justify-center min-w-[80px] py-2.5 px-3.5 rounded-2xl border text-xs transition-all shrink-0 ${
                isSelected
                  ? "bg-[#101E2B] dark:bg-[#A5C7BA] border-transparent text-white dark:text-[#101E2B] font-bold shadow-md"
                  : "bg-card border-black/[0.06] dark:border-white/[0.06] text-[#78848C] hover:bg-black/[0.02] dark:hover:bg-white/[0.05]"
              }`}
            >
              <span className="editorial-tag text-[8px] opacity-70">
                Day {day.dayNumber}
              </span>
              <span className="text-xs font-semibold truncate max-w-[70px] mt-0.5">
                {day.date || `Part ${day.dayNumber}`}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Day View */}
      {currentDayData && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl glass-dock border">
            <div>
              <span className="editorial-tag text-[#6D9D94] block">
                Day {currentDayData.dayNumber} Itinerary
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#18232D] dark:text-[#F8F7F4]">
                {currentDayData.title}
              </h3>
              {currentDayData.description && (
                <p className="text-xs text-[#78848C] mt-1 leading-relaxed">
                  {currentDayData.description}
                </p>
              )}
            </div>

            {editable && onAddActivity && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddActivity(currentDayData.dayNumber)}
                className="rounded-full text-xs gap-1.5 shrink-0 border-black/10 dark:border-white/10"
              >
                <Plus className="w-3.5 h-3.5 text-[#6D9D94]" />
                <span>Add Experience</span>
              </Button>
            )}
          </div>

          {/* Activities list with delicate timeline rail */}
          <div className="space-y-4 relative pl-6 sm:pl-8 border-l-2 border-[#6D9D94]/30 ml-3 sm:ml-4">
            {currentDayData.activities.map((act) => (
              <div key={act.id} className="relative">
                {/* Node Dot on Timeline */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-5 w-3.5 h-3.5 rounded-full bg-background border-2 border-[#6D9D94]" />
                <ActivityCard
                  activity={act}
                  editable={editable}
                  onDelete={(id) =>
                    onDeleteActivity && onDeleteActivity(currentDayData.dayNumber, id)
                  }
                />
              </div>
            ))}

            {currentDayData.activities.length === 0 && (
              <div className="py-12 text-center text-xs text-[#78848C]">
                No experiences recorded for this day yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
