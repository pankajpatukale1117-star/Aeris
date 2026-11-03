"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, Sparkles, MapPin, LayoutDashboard, Bookmark } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()

  const tabs = [
    { name: "Atlas", href: "/destinations", icon: Compass },
    { name: "AI Studio", href: "/ai-planner", icon: Sparkles, highlight: true },
    { name: "Journeys", href: "/trips", icon: MapPin },
    { name: "Saved", href: "/saved", icon: Bookmark },
    { name: "Desk", href: "/dashboard", icon: LayoutDashboard },
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-white/[0.12] px-3 py-2 safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] uppercase tracking-wider font-semibold transition-all ${
                isActive
                  ? "text-[#e8d5b5] font-bold"
                  : "text-[#94a3b8] hover:text-[#f1f5f9]"
              }`}
            >
              <div className="relative mb-0.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-[#e8d5b5] scale-110" : ""}`} />
                {tab.highlight && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]" />
                )}
              </div>
              <span>{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
