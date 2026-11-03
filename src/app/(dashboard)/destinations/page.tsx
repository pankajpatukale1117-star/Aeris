"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Search, Compass, X, ArrowUpRight } from "lucide-react"
import { DESTINATIONS } from "@/lib/constants"
import { DestinationCard } from "@/components/destination/destination-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const CATEGORIES = [
  "All",
  "Beach",
  "Mountain",
  "Culture",
  "Adventure",
  "Nature",
  "Historical",
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
      <div className="space-y-3 pb-8 border-b border-black/[0.08] dark:border-white/[0.08]">
        <span className="editorial-tag">Global Portfolio</span>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
          Discover Extraordinary Places
        </h1>
        <p className="text-sm text-[#78848C] max-w-2xl leading-relaxed">
          An architectural atlas of sanctuaries, ancient capitals, and dramatic landscapes curated for thoughtful exploration.
        </p>
      </div>

      {/* ─── Search & Category Pill Dock ─────────────────────────────────── */}
      <div className="glass-dock p-4 rounded-3xl border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Refined Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-[#78848C] absolute left-3.5 top-3.5" />
            <Input
              placeholder="Search by territory, culture, or climate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 rounded-2xl h-10 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-[#78848C] hover:text-[#18232D]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <span className="text-[#78848C] text-[11px] font-medium tracking-wide">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#18232D] dark:text-[#F8F7F4] focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-black">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs transition-all shrink-0 ${
                  isSelected
                    ? "bg-[#101E2B] dark:bg-[#A5C7BA] text-white dark:text-[#101E2B] font-semibold shadow-sm"
                    : "text-[#78848C] hover:text-[#18232D] dark:hover:text-[#F8F7F4] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
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
        <div className="flex items-center justify-between text-xs text-[#78848C] mb-6">
          <span className="editorial-tag text-[#78848C]">
            Showing {filteredDestinations.length} destination{filteredDestinations.length === 1 ? "" : "s"}
          </span>
          {selectedCategory !== "All" && (
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-[#6D9D94] hover:underline font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredDestinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredDestinations.map((destination, index) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                variant={index % 5 === 0 ? "spotlight" : "portrait"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border p-8 space-y-4 max-w-md mx-auto">
            <Compass className="w-10 h-10 text-[#78848C] mx-auto stroke-1" />
            <h3 className="font-display text-xl font-bold">No results found</h3>
            <p className="text-xs text-[#78848C]">
              We couldn't find destinations matching "{searchQuery}". Try clearing filters or searching for another region.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All")
              }}
              className="rounded-full text-xs"
            >
              Reset Search
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DestinationsPage() {
  return (
    <React.Suspense fallback={<div className="py-20 text-center text-xs text-[#78848C]">Loading atlas...</div>}>
      <DestinationsContent />
    </React.Suspense>
  )
}
