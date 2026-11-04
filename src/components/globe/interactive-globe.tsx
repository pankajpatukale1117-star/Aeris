"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Globe, Loader2 } from "lucide-react"
import { GlobePin } from "./interactive-globe-inner"

const DynamicGlobe = dynamic(
  () => import("./interactive-globe-inner").then((mod) => mod.InteractiveGlobeInner),
  {
    ssr: false,
    loading: () => (
      <div className="glass-shell rounded-3xl p-6 lg:p-8 relative overflow-hidden mb-12 h-[500px] flex flex-col items-center justify-center text-center space-y-3">
        <Globe className="w-8 h-8 text-[#38bdf8] animate-spin" />
        <span className="text-xs text-[#94a3b8] font-semibold tracking-wider uppercase">
          Initializing 60FPS WebGL Globe Architecture...
        </span>
      </div>
    ),
  }
)

interface InteractiveGlobeProps {
  onSelectLocation?: (location: GlobePin) => void
  activeLocation?: { lat: number; lng: number; name?: string } | null
  className?: string
}

export function InteractiveGlobe(props: InteractiveGlobeProps) {
  return <DynamicGlobe {...props} />
}

