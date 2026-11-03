"use client"

import * as React from "react"
import Link from "next/link"
import { Sparkles, Calendar, ArrowRight, ArrowLeft, Sliders, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NewTripPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-10 animate-in fade-in duration-500">
      <Link
        href="/trips"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78848C] hover:text-[#18232D] dark:hover:text-[#F8F7F4] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Journeys</span>
      </Link>

      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="editorial-tag text-[#6D9D94]">Creation Studio</span>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
          Choose Your Planning Method
        </h1>
        <p className="text-sm text-[#78848C]">
          Two equally sophisticated approaches designed for how you travel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Method 1: AI Studio */}
        <div className="glass-dock p-8 rounded-3xl border transition-all duration-500 hover:shadow-2xl space-y-6 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6D9D94]/15 flex items-center justify-center text-[#6D9D94]">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="editorial-tag text-[#6D9D94]">Rapid & Intelligent</span>
              <h2 className="font-display text-2xl font-bold text-[#18232D] dark:text-[#F8F7F4]">
                AI Travel Studio
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#78848C] leading-relaxed">
              Define your destination, dates, and budget tier. Our conversational concierge synthesizes a full day-by-day blueprint with verified timings and expenses.
            </p>

            <ul className="space-y-2 text-xs text-[#78848C] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6D9D94]" />
                <span>Instant multi-day schedule synthesis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6D9D94]" />
                <span>Conversational tweaks & rebalancing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6D9D94]" />
                <span>Verified geographical proximity</span>
              </li>
            </ul>
          </div>

          <Link href="/ai-planner" className="w-full block pt-4">
            <Button className="w-full rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] py-6 font-semibold text-xs shadow-md gap-2">
              <span>Launch AI Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Method 2: Manual Studio */}
        <div className="glass-dock p-8 rounded-3xl border transition-all duration-500 hover:shadow-2xl space-y-6 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#101E2B]/10 dark:bg-white/10 flex items-center justify-center text-[#101E2B] dark:text-white">
              <Sliders className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="editorial-tag text-[#78848C]">Total Discretion</span>
              <h2 className="font-display text-2xl font-bold text-[#18232D] dark:text-[#F8F7F4]">
                Manual Builder
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#78848C] leading-relaxed">
              Design every single minute yourself. Add reservations, custom hiking routes, private villas, and track running expenditures on an elegant timeline.
            </p>

            <ul className="space-y-2 text-xs text-[#78848C] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6D9D94]" />
                <span>Precise reservation timings and costs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6D9D94]" />
                <span>Personal notes and confirmation codes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6D9D94]" />
                <span>Complete day & activity reordering</span>
              </li>
            </ul>
          </div>

          <Link href="/manual-planner" className="w-full block pt-4">
            <Button variant="outline" className="w-full rounded-full border-black/15 dark:border-white/20 py-6 font-semibold text-xs gap-2">
              <span>Open Manual Builder</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
