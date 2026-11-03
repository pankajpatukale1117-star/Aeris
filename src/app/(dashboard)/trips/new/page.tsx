"use client"

import * as React from "react"
import Link from "next/link"
import { Sparkles, ArrowRight, ArrowLeft, Sliders, CheckCircle2, Compass, Layers } from "lucide-react"

export default function NewTripPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 animate-in fade-in duration-700">
      <Link
        href="/trips"
        className="inline-flex items-center gap-2 glass-pill px-4 py-2 text-xs uppercase tracking-widest text-slate-300 hover:text-white transition-all hover:border-[#38bdf8]/50"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#38bdf8]" />
        <span>Return to Journeys</span>
      </Link>

      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 glass-pill px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#e8d5b5]">
          <Layers className="w-3 h-3 text-[#38bdf8]" />
          Expedition Creation Studio
        </div>
        <h1 className="font-editorial text-3xl sm:text-5xl font-medium tracking-tight text-[#f1f5f9]">
          Choose Your <span className="italic text-[#e8d5b5]">Planning Architecture</span>
        </h1>
        <p className="text-sm text-slate-300 font-light leading-relaxed">
          Select between our autonomous AI concierge engine or our granular manual itinerary studio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {/* Method 1: AI Studio */}
        <div className="glass-shell p-8 sm:p-10 rounded-3xl border border-white/10 transition-all duration-500 hover:border-[#38bdf8]/40 space-y-8 flex flex-col justify-between group relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#38bdf8]/15 via-transparent to-transparent blur-3xl pointer-events-none" />

          <div className="space-y-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl glass-pill flex items-center justify-center text-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#38bdf8] font-medium">Autonomous Synthesis</span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-white">
                AI Travel Concierge
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
              Define your destination, dates, travel style, and budget tier. Our conversational engine synthesizes a high-fidelity day-by-day expedition with verified timings and expenses.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/5">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] shrink-0" />
                <span>Instant multi-day schedule and route synthesis</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] shrink-0" />
                <span>Conversational tweaks & budget rebalancing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] shrink-0" />
                <span>Verified geographical proximity and pacing</span>
              </li>
            </ul>
          </div>

          <Link href="/ai-planner" className="w-full block relative z-10 pt-4">
            <div className="btn-luxe w-full py-4 rounded-full font-semibold text-xs flex items-center justify-center gap-2">
              <span>Launch AI Studio</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Method 2: Manual Studio */}
        <div className="glass-shell p-8 sm:p-10 rounded-3xl border border-white/10 transition-all duration-500 hover:border-[#e8d5b5]/40 space-y-8 flex flex-col justify-between group relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#e8d5b5]/15 via-transparent to-transparent blur-3xl pointer-events-none" />

          <div className="space-y-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl glass-pill flex items-center justify-center text-[#e8d5b5] shadow-[0_0_20px_rgba(232,213,181,0.2)]">
              <Sliders className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#e8d5b5] font-medium">Artisanal Curation</span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-white">
                Manual Architect
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
              Design every single minute yourself with total discretion. Add reservations, custom hiking routes, private villas, and track running expenditures on an interactive timeline.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/5">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#e8d5b5] shrink-0" />
                <span>Precise reservation timings and custom budgets</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#e8d5b5] shrink-0" />
                <span>Personal confirmation codes and notes</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#e8d5b5] shrink-0" />
                <span>Complete day & activity reordering control</span>
              </li>
            </ul>
          </div>

          <Link href="/manual-planner" className="w-full block relative z-10 pt-4">
            <div className="glass-pill w-full py-4 rounded-full font-semibold text-xs flex items-center justify-center gap-2 text-slate-100 hover:text-white border-white/15 hover:border-[#e8d5b5]/50 transition-all">
              <span>Open Manual Builder</span>
              <ArrowRight className="w-4 h-4 text-[#e8d5b5]" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
