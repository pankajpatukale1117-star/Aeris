import { ActivityItem, calculateDurationFromTimes, calculateEndTimeFromDuration } from "@/components/trip/activity-card"

/**
 * Calculates straight-line distance between two coordinates using the Haversine formula (km).
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export interface TransitEstimate {
  distanceKm: number
  timeMinutes: number
  mode: "walk" | "drive"
  label: string
  isLongDistance: boolean
}

/**
 * Estimates transit time and travel mode between two points.
 */
export function estimateTransit(p1: [number, number], p2: [number, number]): TransitEstimate {
  const distanceKm = haversineDistance(p1[0], p1[1], p2[0], p2[1])

  if (distanceKm <= 1.5) {
    const timeMinutes = Math.max(5, Math.round((distanceKm / 4.5) * 60))
    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      timeMinutes,
      mode: "walk",
      label: `🚶 ~${timeMinutes} min walk (${distanceKm.toFixed(1)} km)`,
      isLongDistance: false,
    }
  }

  const timeMinutes = Math.max(10, Math.round((distanceKm / 28) * 60) + 5)
  const isLongDistance = distanceKm > 10
  const label = isLongDistance
    ? `⚠️ Long distance: ~${timeMinutes} min drive (${distanceKm.toFixed(1)} km)`
    : `🚗 ~${timeMinutes} min drive (${distanceKm.toFixed(1)} km)`

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    timeMinutes,
    mode: "drive",
    label,
    isLongDistance,
  }
}

/**
 * Assigns or resolves deterministic coordinates for an activity near a base center coordinate.
 */
export function resolveCoordinates(
  act: ActivityItem,
  baseCenter: [number, number] = [40.634, 14.6027],
  index: number = 0
): [number, number] {
  if (act.lat !== undefined && act.lng !== undefined && !isNaN(act.lat) && !isNaN(act.lng)) {
    return [act.lat, act.lng]
  }

  // Deterministic spread around destination center using hash of id or title
  const seed = (act.title || act.id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), index * 37)
  const angle = (seed % 360) * (Math.PI / 180)
  const radius = 0.008 + ((seed % 15) / 1000) // ~1-2km spread
  const latOffset = Math.sin(angle) * radius
  const lngOffset = Math.cos(angle) * radius

  return [baseCenter[0] + latOffset, baseCenter[1] + lngOffset]
}

export interface OptimizationResult {
  activities: ActivityItem[]
  originalDistanceKm: number
  optimizedDistanceKm: number
  savedKm: number
  improved: boolean
}

/**
 * Reorders a list of activities to minimize total transit distance using Nearest-Neighbor + 2-Opt TSP.
 * Preserves initial start time and automatically re-chains times sequentially.
 */
export function optimizeRouteTSP(
  activities: ActivityItem[],
  baseCenter: [number, number] = [40.634, 14.6027]
): OptimizationResult {
  if (activities.length <= 2) {
    const coords = activities.map((a, i) => resolveCoordinates(a, baseCenter, i))
    let dist = 0
    if (coords.length === 2) dist = haversineDistance(coords[0][0], coords[0][1], coords[1][0], coords[1][1])
    return {
      activities,
      originalDistanceKm: dist,
      optimizedDistanceKm: dist,
      savedKm: 0,
      improved: false,
    }
  }

  // 1. Resolve coordinates for all items
  const points = activities.map((act, idx) => ({
    act,
    coords: resolveCoordinates(act, baseCenter, idx),
  }))

  // Calculate original route distance
  let originalDist = 0
  for (let i = 0; i < points.length - 1; i++) {
    originalDist += haversineDistance(
      points[i].coords[0],
      points[i].coords[1],
      points[i + 1].coords[0],
      points[i + 1].coords[1]
    )
  }

  // 2. Nearest-Neighbor Heuristic (start with first stop)
  const unvisited = [...points]
  const ordered = [unvisited.shift()!]

  while (unvisited.length > 0) {
    const current = ordered[ordered.length - 1]
    let nearestIdx = 0
    let nearestDist = Infinity

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineDistance(
        current.coords[0],
        current.coords[1],
        unvisited[i].coords[0],
        unvisited[i].coords[1]
      )
      if (d < nearestDist) {
        nearestDist = d
        nearestIdx = i
      }
    }

    ordered.push(unvisited.splice(nearestIdx, 1)[0])
  }

  // 3. 2-Opt local search refinement to eliminate crossing paths
  let improved = true
  let maxIterations = 20
  while (improved && maxIterations > 0) {
    improved = false
    maxIterations--

    for (let i = 1; i < ordered.length - 1; i++) {
      for (let k = i + 1; k < ordered.length; k++) {
        const d1 = haversineDistance(ordered[i - 1].coords[0], ordered[i - 1].coords[1], ordered[i].coords[0], ordered[i].coords[1]) +
                   haversineDistance(ordered[k].coords[0], ordered[k].coords[1], ordered[(k + 1) % ordered.length]?.coords[0] || ordered[k].coords[0], ordered[(k + 1) % ordered.length]?.coords[1] || ordered[k].coords[1])
        const d2 = haversineDistance(ordered[i - 1].coords[0], ordered[i - 1].coords[1], ordered[k].coords[0], ordered[k].coords[1]) +
                   haversineDistance(ordered[i].coords[0], ordered[i].coords[1], ordered[(k + 1) % ordered.length]?.coords[0] || ordered[k].coords[0], ordered[(k + 1) % ordered.length]?.coords[1] || ordered[k].coords[1])

        if (d2 < d1 - 0.05) {
          // Reverse 2-opt segment
          const segment = ordered.slice(i, k + 1).reverse()
          ordered.splice(i, segment.length, ...segment)
          improved = true
        }
      }
    }
  }

  // Calculate new optimized distance
  let optimizedDist = 0
  for (let i = 0; i < ordered.length - 1; i++) {
    optimizedDist += haversineDistance(
      ordered[i].coords[0],
      ordered[i].coords[1],
      ordered[i + 1].coords[0],
      ordered[i + 1].coords[1]
    )
  }

  // 4. Re-chain activity times based on initial day start time
  let currentStartTime = activities[0].startTime || "09:00"
  const reorderedActivities: ActivityItem[] = ordered.map((item, idx) => {
    const dur = item.act.duration || "1.5h"
    const nextStart = idx === 0 ? currentStartTime : currentStartTime
    const nextEnd = calculateEndTimeFromDuration(nextStart, dur)
    
    // Calculate transit buffer to next stop (e.g. 15-30 mins buffer)
    if (idx < ordered.length - 1) {
      const transit = estimateTransit(item.coords, ordered[idx + 1].coords)
      currentStartTime = calculateEndTimeFromDuration(nextEnd, `${transit.timeMinutes}m`)
    }

    return {
      ...item.act,
      lat: item.coords[0],
      lng: item.coords[1],
      startTime: nextStart,
      endTime: nextEnd,
      time: `${nextStart} — ${nextEnd}`,
    }
  })

  const savedKm = Math.max(0, Math.round((originalDist - optimizedDist) * 10) / 10)

  return {
    activities: reorderedActivities,
    originalDistanceKm: Math.round(originalDist * 10) / 10,
    optimizedDistanceKm: Math.round(optimizedDist * 10) / 10,
    savedKm,
    improved: savedKm > 0.3,
  }
}

