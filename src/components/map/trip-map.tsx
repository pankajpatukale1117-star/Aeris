"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Navigation } from "lucide-react"

export interface MapPoint {
  id: string
  title: string
  lat: number
  lng: number
  category?: string
}

interface TripMapProps {
  points?: MapPoint[]
  center?: [number, number]
  zoom?: number
  routeCoordinates?: Array<[number, number]>
  className?: string
}

// Client-only dynamic wrapper for Leaflet to ensure SSR safety
const DynamicLeafletMap = dynamic(
  () => import("./leaflet-inner").then((mod) => mod.LeafletInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[320px] bg-[#050a10]/80 rounded-2xl flex items-center justify-center text-xs text-slate-400 gap-2 border border-white/10">
        <Navigation className="w-4 h-4 text-[#38bdf8] animate-spin" />
        <span>Initializing telemetry map...</span>
      </div>
    ),
  }
)

export function TripMap({
  points = [],
  center = [35.0116, 135.7681],
  zoom = 12,
  routeCoordinates,
  className = "h-[360px] sm:h-[420px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl",
}: TripMapProps) {
  return (
    <div className={`relative ${className}`}>
      <DynamicLeafletMap points={points} center={center} zoom={zoom} routeCoordinates={routeCoordinates} />
    </div>
  )
}
