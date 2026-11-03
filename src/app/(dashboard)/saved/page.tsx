"use client"

import * as React from "react"
import Link from "next/link"
import { Bookmark, Compass } from "lucide-react"
import { DESTINATIONS } from "@/lib/constants"
import { DestinationCard } from "@/components/destination/destination-card"
import { Button } from "@/components/ui/button"

export default function SavedPage() {
  const [savedList, setSavedList] = React.useState(DESTINATIONS.slice(0, 4))

  const handleRemove = (id: string) => {
    setSavedList((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="space-y-1">
          <span className="editorial-tag text-[#6D9D94]">Travel Desk</span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
            Saved Destinations
          </h1>
          <p className="text-sm text-[#78848C]">
            Curated bookmarks ready to be synthesized into defining journeys.
          </p>
        </div>

        <Link href="/destinations">
          <Button variant="outline" size="sm" className="rounded-full gap-2 text-xs border-black/10 dark:border-white/10 px-5 py-5">
            <Compass className="w-3.5 h-3.5 text-[#6D9D94]" />
            <span>Browse Full Atlas</span>
          </Button>
        </Link>
      </div>

      {savedList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {savedList.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              isSaved={true}
              onSave={handleRemove}
              variant="portrait"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-dock rounded-3xl border p-8 space-y-4 max-w-md mx-auto">
          <Bookmark className="w-10 h-10 text-[#78848C] mx-auto stroke-1" />
          <h3 className="font-display text-xl font-bold">Your desk is clear</h3>
          <p className="text-xs text-[#78848C]">
            Explore our global atlas and tap the bookmark icon on any destination that inspires you.
          </p>
          <Link href="/destinations">
            <Button className="rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] text-white dark:text-[#101E2B] text-xs px-6">
              Explore Atlas
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
