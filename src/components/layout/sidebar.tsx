"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  Bookmark,
  LayoutDashboard,
  PlusCircle,
  ArrowRight,
  LogOut,
  User,
} from "lucide-react"
import { useTravelStore } from "@/lib/store/travel-store"

export function Sidebar() {
  const pathname = usePathname()
  const user = useTravelStore((state) => state.user)
  const logout = useTravelStore((state) => state.logout)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const links = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Trips", href: "/trips", icon: MapPin },
    { name: "AI Studio", href: "/ai-planner", icon: Sparkles, badge: "AI" },
    { name: "Manual Planner", href: "/manual-planner", icon: Calendar },
    { name: "Global Atlas", href: "/destinations", icon: Compass },
    { name: "Saved Places", href: "/saved", icon: Bookmark },
  ]

  return (
    <aside className="w-64 border-r border-black/[0.06] dark:border-white/[0.06] bg-[#F8F7F4]/80 dark:bg-[#101E2B]/80 backdrop-blur-xl hidden lg:flex flex-col justify-between p-5 min-h-[calc(100vh-5rem)]">
      <div className="space-y-6">
        {/* Create CTA Button */}
        <div>
          <Link
            href="/trips/new"
            className="w-full flex items-center justify-center gap-2 bg-[#101E2B] dark:bg-[#A5C7BA] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] text-white dark:text-[#101E2B] font-semibold text-xs py-3 px-4 rounded-full shadow-sm transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New Journey</span>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-medium tracking-wide transition-colors ${
                  isActive
                    ? "bg-black/5 dark:bg-white/10 text-[#101E2B] dark:text-[#F8F7F4] font-semibold"
                    : "text-[#78848C] hover:text-[#18232D] dark:hover:text-[#F8F7F4] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#6D9D94]" : "text-[#78848C]"}`} />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[#6D9D94]/20 text-[#6D9D94]">
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Session Footer & Desk Status */}
      <div className="space-y-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
        {mounted && user.isAuthenticated ? (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#101E2B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={user.fullName} fill className="object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
              </div>
              <div className="truncate min-w-0">
                <div className="text-xs font-semibold truncate text-[#18232D] dark:text-[#F8F7F4]">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-[#78848C] truncate">
                  {user.tier}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-[#78848C] hover:text-red-500 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] text-center space-y-2">
            <p className="text-xs text-[#78848C]">Sign in to unlock real-time synching</p>
            <Link href="/login" className="block">
              <span className="text-xs font-semibold text-[#6D9D94] hover:underline">
                Sign In →
              </span>
            </Link>
          </div>
        )}

        {/* Desk Inspiration Card */}
        <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-xs space-y-2">
          <span className="editorial-tag text-[9px] text-[#6D9D94]">Inspiration</span>
          <p className="font-semibold text-[#18232D] dark:text-[#F8F7F4] text-xs leading-snug">
            Bespoke AI Synthesis
          </p>
          <p className="text-[11px] text-[#78848C] leading-relaxed">
            Craft complete multi-day itineraries aligned with your taste.
          </p>
          <Link
            href="/ai-planner"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6D9D94] hover:underline pt-1"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
