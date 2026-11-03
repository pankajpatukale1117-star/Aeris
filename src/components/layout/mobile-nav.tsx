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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F8F7F4]/90 dark:bg-[#101E2B]/90 backdrop-blur-xl border-t border-black/[0.08] dark:border-white/[0.08] px-3 py-2 safe-bottom">
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
                  ? "text-[#101E2B] dark:text-[#A5C7BA] font-bold"
                  : "text-[#78848C] hover:text-[#18232D]"
              }`}
            >
              <div className="relative mb-0.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-[#6D9D94] scale-110" : ""}`} />
                {tab.highlight && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#6D9D94]" />
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
