"use client"

import * as React from "react"
import {
  Bookmark,
  Plus,
  Trash2,
  X,
  ArrowRight,
  MapPin,
  Tag,
  DollarSign,
  ChevronRight,
  FolderOpen,
} from "lucide-react"
import { ActivityItem } from "@/components/trip/activity-card"
import { parseQuickAdd } from "@/lib/planner/quick-add-parser"

export interface StagedItem {
  id: string
  title: string
  location?: string
  estimatedCost?: string
  category: string
  notes?: string
}

interface ScratchpadTrayProps {
  isOpen: boolean
  onClose: () => void
  stagedItems: StagedItem[]
  activeDayNumber: number
  allDayNumbers: number[]
  currencySymbol: string
  onAddItem: (item: StagedItem) => void
  onRemoveItem: (id: string) => void
  onMoveToDay: (item: StagedItem, targetDayNumber: number) => void
}

export function ScratchpadTray({
  isOpen,
  onClose,
  stagedItems,
  activeDayNumber,
  allDayNumbers,
  currencySymbol,
  onAddItem,
  onRemoveItem,
  onMoveToDay,
}: ScratchpadTrayProps) {
  const [quickInput, setQuickInput] = React.useState("")

  const handleAddStaged = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickInput.trim()) return

    const parsed = parseQuickAdd(quickInput, "10:00")
    const newItem: StagedItem = {
      id: `staged-${Date.now()}`,
      title: parsed.title,
      location: parsed.location,
      estimatedCost: parsed.estimatedCost,
      category: parsed.category,
    }

    onAddItem(newItem)
    setQuickInput("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 glass-shell border-l border-white/20 shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300 bg-[#050a10]/95 backdrop-blur-2xl">
      <div className="space-y-5 flex-1 overflow-y-auto pr-1 scrollbar-none">
        {/* Tray Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#e8d5b5]" />
            <div>
              <h3 className="font-editorial text-lg font-bold text-white">
                Trip Bucket List
              </h3>
              <p className="text-[10px] text-slate-400">
                Staged places & ideas waiting to be scheduled ({stagedItems.length})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add Staged Item */}
        <form onSubmit={handleAddStaged} className="space-y-2">
          <div className="flex items-center glass-input rounded-xl p-1 focus-within:border-[#38bdf8]">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="e.g. Ravello Gardens, Osteria Lunch $50"
              className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none min-w-0"
            />
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="btn-luxe p-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5 text-[#050a10]" />
            </button>
          </div>
        </form>

        {/* Staged Items List */}
        <div className="space-y-2.5">
          {stagedItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl glass-card border border-white/10 hover:border-white/20 transition-all space-y-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="text-xs font-semibold text-white leading-tight">
                    {item.title}
                  </h5>
                  {item.location && (
                    <span className="text-[10px] text-[#94a3b8] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-[#38bdf8]" />
                      {item.location}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove from bucket list"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="editorial-tag text-[8px] text-[#38bdf8] glass-pill px-1.5 py-0.2 rounded-full">
                    {item.category}
                  </span>
                  {item.estimatedCost && item.estimatedCost !== "Free" && (
                    <span className="text-[9px] font-mono text-[#e8d5b5]">
                      {currencySymbol}{item.estimatedCost}
                    </span>
                  )}
                </div>

                {/* Move to Day Button */}
                <button
                  type="button"
                  onClick={() => onMoveToDay(item, activeDayNumber)}
                  className="glass-pill px-2.5 py-1 text-[10px] font-semibold text-[#e8d5b5] hover:text-white flex items-center gap-1 cursor-pointer border-[#e8d5b5]/30 hover:border-[#e8d5b5] active:scale-95 transition-all"
                  title={`Move directly into Day ${activeDayNumber}`}
                >
                  <span>Add to Day {activeDayNumber}</span>
                  <ChevronRight className="w-3 h-3 text-[#38bdf8]" />
                </button>
              </div>
            </div>
          ))}

          {stagedItems.length === 0 && (
            <div className="text-center py-10 space-y-2 glass-card rounded-xl p-4 border border-dashed border-white/10">
              <FolderOpen className="w-8 h-8 text-slate-500 mx-auto stroke-1" />
              <p className="text-xs text-slate-400">
                Your bucket list is empty.
              </p>
              <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto">
                Jot down places, viewpoints, or bars you want to visit before deciding which day to place them.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-4 border-t border-white/10 text-center">
        <p className="text-[10px] text-slate-500 font-mono">
          Items in your scratchpad persist across reloads.
        </p>
      </div>
    </div>
  )
}

