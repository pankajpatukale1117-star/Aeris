"use client"

import * as React from "react"
import { Plus, Sparkles, Clock, DollarSign, Tag, ArrowRight, LayoutTemplate } from "lucide-react"
import { parseQuickAdd, ParsedActivity } from "@/lib/planner/quick-add-parser"
import { QUICK_STAMPS, DAY_TEMPLATES, DayTemplate, QuickStamp } from "@/lib/planner/day-templates"
import { calculateEndTimeFromDuration } from "@/components/trip/activity-card"

interface QuickAddBarProps {
  dayNumber: number
  defaultStartTime: string
  currencySymbol: string
  onAddActivity: (act: ParsedActivity) => void
  onApplyTemplate: (template: DayTemplate) => void
  onApplyStamp: (stamp: QuickStamp) => void
}

export function QuickAddBar({
  dayNumber,
  defaultStartTime,
  currencySymbol,
  onAddActivity,
  onApplyTemplate,
  onApplyStamp,
}: QuickAddBarProps) {
  const [inputVal, setInputVal] = React.useState("")
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = React.useState(false)

  // Live parsed preview as user types
  const parsedPreview = React.useMemo(() => {
    if (!inputVal.trim() || inputVal.trim().length < 3) return null
    return parseQuickAdd(inputVal, defaultStartTime)
  }, [inputVal, defaultStartTime])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return

    const parsed = parseQuickAdd(inputVal, defaultStartTime)
    onAddActivity(parsed)
    setInputVal("")
  }

  return (
    <div className="space-y-2.5">
      {/* ─── Natural Language Input Bar ───────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="relative group flex items-center glass-card rounded-2xl border border-white/20 shadow-lg p-1.5 focus-within:border-[#38bdf8] focus-within:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all bg-[#050a10]/80"
      >
        <div className="pl-3 pr-2 text-[#38bdf8] flex items-center">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>

        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={`Quick add: e.g. Dinner at Franco's 8:00 PM ${currencySymbol}80 (1.5h)`}
          className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none py-2 px-1 min-w-0"
        />

        <div className="flex items-center gap-1.5 pr-1 shrink-0">
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="btn-luxe px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <span>Add</span>
            <ArrowRight className="w-3 h-3 text-[#050a10]" />
          </button>
        </div>
      </form>

      {/* ─── Real-Time Extracted Entities Badge Preview ───────────────────── */}
      {parsedPreview && (
        <div className="flex items-center gap-2 flex-wrap text-[10px] px-2 animate-reveal">
          <span className="text-slate-400 font-medium">Extracted:</span>
          <span className="glass-pill px-2 py-0.5 rounded-full text-[#38bdf8] font-mono flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {parsedPreview.startTime} — {parsedPreview.endTime} ({parsedPreview.duration})
          </span>
          {parsedPreview.estimatedCost && parsedPreview.estimatedCost !== "Free" && (
            <span className="glass-pill px-2 py-0.5 rounded-full text-[#e8d5b5] font-mono flex items-center gap-1">
              <DollarSign className="w-2.5 h-2.5" />
              {currencySymbol}{parsedPreview.estimatedCost}
            </span>
          )}
          <span className="glass-pill px-2 py-0.5 rounded-full text-[#34d399] flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />
            {parsedPreview.category}
          </span>
          {parsedPreview.location && (
            <span className="glass-pill px-2 py-0.5 rounded-full text-slate-300">
              📍 {parsedPreview.location}
            </span>
          )}
        </div>
      )}

      {/* ─── 1-Click Quick Stamps & Day Templates ──────────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1 shrink-0">
            Quick Stamps:
          </span>
          {QUICK_STAMPS.map((stamp) => (
            <button
              key={stamp.id}
              type="button"
              onClick={() => onApplyStamp(stamp)}
              className="glass-pill px-2.5 py-1 rounded-full text-[11px] text-slate-200 hover:text-white hover:border-[#38bdf8]/40 flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95"
              title={`Instantly append ${stamp.title}`}
            >
              <span>{stamp.icon}</span>
              <span>{stamp.label}</span>
            </button>
          ))}
        </div>

        {/* Modular Templates Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
            className="glass-pill px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#e8d5b5] hover:text-white flex items-center gap-1.5 cursor-pointer border-[#e8d5b5]/30 hover:border-[#e8d5b5]"
          >
            <LayoutTemplate className="w-3 h-3 text-[#38bdf8]" />
            <span>Day Presets</span>
          </button>

          {isTemplateMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl glass-dock border border-white/20 shadow-2xl p-2 z-50 space-y-1 animate-reveal bg-[#050a10]/95">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold px-2 py-1 border-b border-white/10">
                1-Click Day Templates
              </div>
              {DAY_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    onApplyTemplate(tpl)
                    setIsTemplateMenuOpen(false)
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-colors text-xs space-y-0.5 cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-white group-hover:text-[#38bdf8]">
                    <span>{tpl.icon}</span>
                    <span>{tpl.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{tpl.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

