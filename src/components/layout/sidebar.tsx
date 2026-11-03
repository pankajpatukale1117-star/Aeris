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
    { name: "My Journeys", href: "/trips", icon: MapPin },
    { name: "AI Concierge", href: "/ai-planner", icon: Sparkles, badge: "AI" },
    { name: "Manual Studio", href: "/manual-planner", icon: Calendar },
    { name: "Global Atlas", href: "/destinations", icon: Compass },
    { name: "Saved Sanctuaries", href: "/saved", icon: Bookmark },
  ]

  return (
    <aside className="w-64 border-r border-white/[0.08] glass-nav backdrop-blur-2xl hidden lg:flex flex-col justify-between p-5 min-h-[calc(100vh-5rem)]">
      <div className="space-y-6">
        {/* Create CTA Button with Liquid Gold */}
        <div>
          <Link
            href="/trips/new"
            className="w-full flex items-center justify-center gap-2 btn-luxe text-xs py-3 px-4 rounded-full shadow-lg transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#050a10]" />
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
                className={`flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all ${
                  isActive
                    ? "glass-pill text-[#f1f5f9] font-semibold border-white/25 shadow-[0_0_15px_rgba(232,213,181,0.15)]"
                    : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#e8d5b5]" : "text-[#94a3b8]"}`} />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Session Footer & Desk Status */}
      <div className="space-y-3 pt-4 border-t border-white/[0.08]">
        {mounted && user.isAuthenticated ? (
          <div className="flex items-center justify-between p-2.5 rounded-2xl glass-card">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#050a10] border border-[#e8d5b5]/40 text-[#e8d5b5] text-xs font-bold flex items-center justify-center shrink-0">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={user.fullName} fill className="object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
              </div>
              <div className="truncate min-w-0">
                <div className="text-xs font-semibold truncate text-[#f1f5f9]">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-[#e8d5b5] truncate">
                  {user.tier}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-[#94a3b8] hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl glass-card text-center space-y-2">
            <p className="text-xs text-[#94a3b8]">Sign in to unlock sync</p>
            <Link href="/login" className="block">
              <span className="text-xs font-semibold text-[#e8d5b5] hover:underline">
                Sign In →
              </span>
            </Link>
          </div>
        )}

        {/* Desk Inspiration Card */}
        <div className="p-4 rounded-2xl glass-card text-xs space-y-2">
          <span className="editorial-tag text-[9px] text-[#38bdf8]">Liquid Intelligence</span>
          <p className="font-semibold text-[#f1f5f9] text-xs leading-snug">
            Bespoke Concierge
          </p>
          <p className="text-[11px] text-[#94a3b8] leading-relaxed">
            Multi-day blueprints synthesized in real time.
          </p>
          <Link
            href="/ai-planner"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#e8d5b5] hover:underline pt-1"
          >
            <span>Launch Concierge</span>
            <ArrowRight className="w-3 h-3 text-[#e8d5b5]" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
