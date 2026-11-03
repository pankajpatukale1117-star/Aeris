"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Search, Compass, X, ArrowUpRight } from "lucide-react"
import { DESTINATIONS } from "@/lib/constants"
import { DestinationCard } from "@/components/destination/destination-card"

const CATEGORIES = [
  "All",
  "Beach",
  "Mountain",
  "Culture",
  "Adventure",
  "City",
]

const SORT_OPTIONS = [
  { label: "Highest Rated", value: "rating" },
  { label: "Alphabetical", value: "name" },
]

function DestinationsContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || "All"
  const initialQuery = searchParams.get("query") || searchParams.get("search") || ""

  const [searchQuery, setSearchQuery] = React.useState(initialQuery === "All" ? "" : initialQuery)
  const [selectedCategory, setSelectedCategory] = React.useState(initialCategory)
  const [sortBy, setSortBy] = React.useState("rating")

  React.useEffect(() => {
    const cat = searchParams.get("category")
    if (cat) setSelectedCategory(cat)
    const q = searchParams.get("query") || searchParams.get("search")
    if (q && q !== "All") setSearchQuery(q)
  }, [searchParams])

  const filteredDestinations = React.useMemo(() => {
    return DESTINATIONS.filter((dest) => {
      const matchesSearch =
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === "All" ||
        dest.category.toLowerCase() === selectedCategory.toLowerCase()

      return matchesSearch && matchesCategory
    }).sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating
      if (sortBy === "name") return a.name.localeCompare(b.name)
      return 0
    })
  }, [searchQuery, selectedCategory, sortBy])

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* ─── Editorial Header ────────────────────────────────────────────── */}
      <div className="space-y-3 pb-8 border-b border-white/[0.08]">
        <span className="editorial-tag text-[#e8d5b5]">Global Portfolio</span>
        <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f1f5f9]">
          Discover Extraordinary Sanctuaries
        </h1>
        <p className="text-sm text-[#94a3b8] max-w-2xl leading-relaxed">
          An architectural atlas of sanctuaries, ancient capitals, and dramatic landscapes curated for thoughtful exploration.
        </p>
      </div>

      {/* ─── Search & Category Pill Dock ─────────────────────────────────── */}
      <div className="glass-dock p-4 rounded-3xl border border-white/15 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Refined Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3.5" />
            <input
              placeholder="Search by territory, culture, or climate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 rounded-2xl h-10 text-xs sm:text-sm glass-input w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-[#94a3b8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <span className="text-[#94a3b8] text-[11px] font-medium tracking-wide">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass-input rounded-xl px-3 py-1.5 text-xs font-semibold text-[#f1f5f9] focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#050a10] text-[#f1f5f9]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`glass-pill px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected ? "active font-bold text-white shadow-[0_0_15px_rgba(232,213,181,0.25)]" : "text-[#94a3b8]"
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Editorial Grid ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-6">
          <span className="editorial-tag text-[#e8d5b5]">
            Showing {filteredDestinations.length} destination{filteredDestinations.length === 1 ? "" : "s"}
          </span>
          <span className="text-[11px]">Updated today</span>
        </div>

        {filteredDestinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredDestinations.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} variant="portrait" />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 glass-dock rounded-3xl border border-white/15 p-8 space-y-4 max-w-md mx-auto">
            <Compass className="w-10 h-10 text-[#94a3b8] mx-auto stroke-1" />
            <h3 className="font-editorial text-2xl font-bold text-white">No territories found</h3>
            <p className="text-xs text-[#94a3b8]">
              No destinations match "{searchQuery}" under the selected category.
            </p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All")
              }}
              className="btn-luxe px-6 py-2.5 text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DestinationsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#e8d5b5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#94a3b8]">Opening global atlas...</p>
        </div>
      }
    >
      <DestinationsContent />
    </React.Suspense>
  )
}
