"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Globe } from "lucide-react"

const DynamicGlobe = dynamic(
  () => import("../InteractiveGlobe").then((mod) => mod.InteractiveGlobe || mod.default),
  {
    ssr: false,
    loading: () => (
      <div
        className="glass-shell rounded-3xl p-6 lg:p-8 relative overflow-hidden mb-12 flex flex-col items-center justify-center text-center space-y-3"
        style={{ height: "600px", width: "100%" }}
      >
        <Globe className="w-8 h-8 text-[#38bdf8] animate-spin" />
        <span className="text-xs text-[#e8d5b5] font-semibold tracking-widest uppercase">
          Loading 3D Planetary Sanctuary Atlas...
        </span>
      </div>
    ),
  }
)

export interface InteractiveGlobeProps {
  onSelectDestination?: (placeName: string, coords: { lat: number; lng: number }) => void
  onSelectLocation?: (location: any) => void
  activeLocation?: { lat: number; lng: number; name?: string } | null
  className?: string
}

export function InteractiveGlobe(props: InteractiveGlobeProps) {
  return <DynamicGlobe {...props} />
}

export default InteractiveGlobe
