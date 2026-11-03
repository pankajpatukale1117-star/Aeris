"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { MapPin, Navigation, Info } from "lucide-react"

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
  className?: string
}

// Client-only dynamic wrapper for Leaflet to ensure SSR safety
const DynamicLeafletMap = dynamic(
  () => import("./leaflet-inner").then((mod) => mod.LeafletInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[320px] bg-muted/60 animate-pulse rounded-2xl flex items-center justify-center text-xs text-muted-foreground gap-2">
        <Navigation className="w-4 h-4 text-[#64B5A7] animate-spin" />
        <span>Initializing interactive map...</span>
      </div>
    ),
  }
)

export function TripMap({
  points = [],
  center = [35.0116, 135.7681], // default Kyoto
  zoom = 12,
  className = "h-[360px] sm:h-[420px] w-full rounded-2xl overflow-hidden border border-border shadow-sm",
}: TripMapProps) {
  return (
    <div className={`relative ${className}`}>
      <DynamicLeafletMap points={points} center={center} zoom={zoom} />
    </div>
  )
}

