"use client"

import * as React from "react"
import { AlertCircle, RotateCcw, Home, Trash2 } from "lucide-react"
import Link from "next/link"

export default function ManualPlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Log error for diagnostics
    console.error("ROVEO Manual Planner caught error:", error)
  }, [error])

  const handleClearDraftAndReset = () => {
    try {
      localStorage.removeItem("roveo_manual_draft_v1")
      localStorage.removeItem("roveo_manual_scratchpad_v1")
    } catch {}
    window.location.href = "/manual-planner?new=true"
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg glass-shell border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-6 bg-[#050a10]/95 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 glass-pill px-3 py-0.5 rounded-full text-[10px] uppercase tracking-wider text-rose-300">
            <span>Planner Session Recovery</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Itinerary Interrupted
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            {error?.message || "An unexpected error occurred while rendering the manual itinerary builder."}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-left text-xs space-y-1 font-mono text-slate-400">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Troubleshooting Note:</div>
          <div>If your browser stored an older or mismatched draft in local storage, resetting will restore clean defaults.</div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Reload Itinerary</span>
          </button>

          <button
            type="button"
            onClick={handleClearDraftAndReset}
            className="w-full sm:w-auto btn-luxe px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#050a10]" />
            <span>Clear Draft & Plan Fresh</span>
          </button>
        </div>

        <div className="pt-2 border-t border-white/10 text-center">
          <Link
            href="/dashboard"
            className="text-[11px] text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 font-mono"
          >
            <Home className="w-3 h-3" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

