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
  Menu,
  X,
  Sun,
  Moon,
  ArrowRight,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useTravelStore } from "@/lib/store/travel-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  const user = useTravelStore((state) => state.user)
  const logout = useTravelStore((state) => state.logout)

  React.useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navLinks = [
    { name: "Atlas", href: "/destinations" },
    { name: "Curations", href: "/destinations?category=Culture" },
    { name: "My Journeys", href: "/trips" },
    { name: "AI Concierge", href: "/ai-planner", badge: "AI" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "py-3 px-4 sm:px-6 lg:px-8"
          : "py-5 sm:py-6 px-4 sm:px-6 lg:px-8"
      }`}
    >
      <div
        className={`max-w-6xl mx-auto rounded-full transition-all duration-500 px-5 sm:px-7 py-2.5 sm:py-3 flex items-center justify-between ${
          isScrolled
            ? "glass-nav"
            : "glass-shell"
        }`}
      >
        {/* Brand Wordmark with Liquid Champagne Accent */}
        <Link href="/" className="flex items-center gap-2 group tracking-tight">
          <span className="font-editorial text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#f1f5f9] group-hover:text-[#e8d5b5] transition-colors">
            ROVEO
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e8d5b5] transition-transform duration-300 group-hover:scale-150 shadow-[0_0_8px_rgba(232,213,181,0.8)]" />
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
                  isActive
                    ? "text-[#f1f5f9] font-semibold bg-white/[0.12] border border-white/[0.18] shadow-sm"
                    : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.05]"
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="ml-1.5 text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Right Controls & CTAs */}
        <div className="hidden md:flex items-center gap-2.5">
          {mounted && user.isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill text-xs font-semibold hover:border-[#e8d5b5] transition-all cursor-pointer">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#050a10] border border-[#e8d5b5]/40 text-[#e8d5b5] flex items-center justify-center relative text-[10px] font-bold">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt={user.fullName} fill className="object-cover" />
                    ) : (
                      user.fullName.charAt(0)
                    )}
                  </div>
                  <span className="truncate max-w-[100px] text-xs text-[#f1f5f9]">
                    {user.fullName.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 text-xs glass-dock border border-white/20 shadow-2xl">
                <DropdownMenuLabel className="font-normal px-2.5 py-1.5">
                  <div className="font-semibold text-sm text-[#f1f5f9]">{user.fullName}</div>
                  <div className="text-[10px] text-[#e8d5b5] truncate">{user.tier}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer rounded-xl px-2.5 py-2 hover:bg-white/10 text-[#f1f5f9]">
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Travel Desk</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/trips" className="flex items-center gap-2 cursor-pointer rounded-xl px-2.5 py-2 hover:bg-white/10 text-[#f1f5f9]">
                    <MapPin className="w-3.5 h-3.5 text-[#e8d5b5]" />
                    <span>My Journeys</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 cursor-pointer rounded-xl px-2.5 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className="glass-pill px-4 py-1.5 rounded-full text-xs font-medium text-[#f1f5f9] hover:text-[#e8d5b5]">
              Login
            </Link>
          )}

          <Link href="/trips/new">
            <button className="btn-luxe px-5 py-2 text-xs font-semibold gap-1.5 cursor-pointer">
              <span>Start Planning</span>
            </button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#f1f5f9] glass-pill rounded-full focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Glass Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-sm glass-dock rounded-3xl p-5 border border-white/20 shadow-2xl animate-reveal">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-[#f1f5f9] hover:bg-white/10"
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            <Link
              href="/dashboard"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-[#f1f5f9] hover:bg-white/10"
            >
              <span>Travel Desk</span>
            </Link>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              {mounted && user.isAuthenticated ? (
                <button
                  onClick={logout}
                  className="text-xs font-semibold text-red-400 py-2 px-3 hover:underline"
                >
                  Sign Out ({user.fullName.split(" ")[0]})
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#e8d5b5] py-2 px-3"
                >
                  Sign In
                </Link>
              )}

              <Link href="/trips/new" className="flex-1">
                <button className="btn-luxe w-full py-2.5 text-xs font-semibold">
                  Start Planning
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
