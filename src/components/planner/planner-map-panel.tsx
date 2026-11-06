"use client"

import * as React from "react"
import { MapPin, Zap, Navigation, X, Check, ArrowRight } from "lucide-react"
import { ActivityItem } from "@/components/trip/activity-card"
import { TripMap, MapPoint } from "@/components/map/trip-map"
import { resolveCoordinates, optimizeRouteTSP, OptimizationResult } from "@/lib/planner/route-optimizer"
import { useToast } from "@/hooks/use-toast"

interface PlannerMapPanelProps {
  dayNumber: number
  dayTitle: string
  activities: ActivityItem[]
  destinationCenter: [number, number]
  onOptimizeRoute: (optimizedActivities: ActivityItem[]) => void
  onClose?: () => void
}

export function PlannerMapPanel({
  dayNumber,
  dayTitle,
  activities,
  destinationCenter,
  onOptimizeRoute,
  onClose,
}: PlannerMapPanelProps) {
  const { toast } = useToast()
  const [isOptimizing, setIsOptimizing] = React.useState(false)

  // Map points from activities with numbered labels
  const { mapPoints, routeCoordinates, totalDistanceKm } = React.useMemo(() => {
    let totalDist = 0
    const points: MapPoint[] = activities.map((act, idx) => {
      const coords = resolveCoordinates(act, destinationCenter, idx)
      return {
        id: act.id,
        title: `${idx + 1}. ${act.title}`,
        lat: coords[0],
        lng: coords[1],
        category: act.category,
      }
    })

    const coordsList: Array<[number, number]> = points.map((p) => [p.lat, p.lng])

    for (let i = 0; i < coordsList.length - 1; i++) {
      const p1 = coordsList[i]
      const p2 = coordsList[i + 1]
      // Simple euclidean approximation for preview
      const d = Math.sqrt(Math.pow((p2[0] - p1[0]) * 111, 2) + Math.pow((p2[1] - p1[1]) * 85, 2))
      totalDist += d
    }

    return {
      mapPoints: points,
      routeCoordinates: coordsList,
      totalDistanceKm: Math.round(totalDist * 10) / 10,
    }
  }, [activities, destinationCenter])

  const handleRunOptimization = () => {
    if (activities.length < 3) {
      toast({
        title: "Route Already Optimal",
        description: "Add 3 or more stops to calculate geometric path optimization.",
      })
      return
    }

    setIsOptimizing(true)
    setTimeout(() => {
      const result: OptimizationResult = optimizeRouteTSP(activities, destinationCenter)
      onOptimizeRoute(result.activities)
      setIsOptimizing(false)

      if (result.improved) {
        toast({
          title: "⚡ Route Optimized (TSP 2-Opt)",
          description: `Eliminated backtracking: Saved ~${result.savedKm} km of travel time!`,
        })
      } else {
        toast({
          title: "Route Verified",
          description: "Your stops are already in the most efficient geographic order.",
        })
      }
    }, 200)
  }

  return (
    <div className="glass-shell rounded-3xl border border-white/20 shadow-2xl p-5 sm:p-6 space-y-4 bg-[#050a10]/90">
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center border border-[#38bdf8]/30">
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-editorial text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Day {dayNumber} Spatial Route</span>
              <span className="text-[10px] font-mono text-slate-400 glass-pill px-2 py-0.2 rounded-full">
                {activities.length} stops • ~{totalDistanceKm} km
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pure Math 2-opt TSP Optimizer Button (Requirement 5) */}
          <button
            type="button"
            onClick={handleRunOptimization}
            disabled={isOptimizing || activities.length < 3}
            className="btn-luxe px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
            title="Reorder stops using nearest-neighbor + 2-opt TSP to minimize travel distance"
          >
            <Zap className="w-3.5 h-3.5 text-[#050a10]" />
            <span>{isOptimizing ? "Optimizing..." : "Optimize Route"}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Embedded Leaflet Map */}
      <div className="rounded-2xl overflow-hidden border border-white/15 shadow-inner">
        <TripMap
          points={mapPoints}
          center={destinationCenter}
          zoom={12}
          routeCoordinates={routeCoordinates}
          className="h-[300px] sm:h-[380px] w-full"
        />
      </div>

      {/* Route Stops Sequence Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px] shrink-0">
          Path:
        </span>
        {activities.map((act, idx) => (
          <div key={act.id} className="flex items-center gap-1.5 shrink-0">
            <span className="glass-pill px-2 py-0.5 rounded-full text-slate-200 font-medium flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center text-[9px] font-mono font-bold">
                {idx + 1}
              </span>
              <span className="truncate max-w-[120px]">{act.title}</span>
            </span>
            {idx < activities.length - 1 && (
              <span className="text-white/20">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

