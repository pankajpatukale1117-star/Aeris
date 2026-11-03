"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Compass, Sparkles, MapPin, Calendar, Menu, X, Sun, Moon, ArrowRight, User, LogOut, LayoutDashboard } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
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
      setIsScrolled(window.scrollY > 30)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navLinks = [
    { name: "Explore", href: "/destinations" },
    { name: "Discover", href: "/destinations?category=Culture" },
    { name: "My Trips", href: "/trips" },
    { name: "AI Studio", href: "/ai-planner", badge: "AI" },
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
            ? "glass-dock border shadow-lg"
            : "bg-transparent border-transparent"
        }`}
      >
        {/* Brand Wordmark */}
        <Link href="/" className="flex items-center gap-2 group tracking-tight">
          <span className="font-display text-2xl sm:text-2xl font-bold tracking-[-0.03em] text-[#101E2B] dark:text-[#F8F7F4] group-hover:opacity-90 transition-opacity">
            ROVEO
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#6D9D94] transition-transform duration-300 group-hover:scale-150" />
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
                    ? "text-[#101E2B] dark:text-[#F8F7F4] font-semibold bg-black/5 dark:bg-white/10"
                    : "text-[#18232D]/70 dark:text-[#F8F7F4]/70 hover:text-[#101E2B] dark:hover:text-[#F8F7F4] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="ml-1.5 text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded-full bg-[#6D9D94]/20 text-[#6D9D94] dark:bg-[#A5C7BA]/20 dark:text-[#A5C7BA]">
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Right CTAs */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-[#78848C] hover:text-[#18232D] dark:hover:text-[#F8F7F4] transition-colors"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
          </button>

          {mounted && user.isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-dock border border-black/10 dark:border-white/15 text-xs font-semibold hover:border-[#6D9D94] transition-colors">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#101E2B] text-white flex items-center justify-center relative text-[10px]">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt={user.fullName} fill className="object-cover" />
                    ) : (
                      user.fullName.charAt(0)
                    )}
                  </div>
                  <span className="truncate max-w-[100px]">{user.fullName.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 text-xs shadow-xl">
                <DropdownMenuLabel className="font-normal px-2.5 py-1.5">
                  <div className="font-semibold text-sm">{user.fullName}</div>
                  <div className="text-[10px] text-[#78848C] truncate">{user.email || user.tier}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer rounded-xl px-2.5 py-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#6D9D94]" />
                    <span>Travel Desk</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/trips" className="flex items-center gap-2 cursor-pointer rounded-xl px-2.5 py-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6D9D94]" />
                    <span>My Journeys</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 cursor-pointer rounded-xl px-2.5 py-1.5 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <span className="text-xs font-medium text-[#18232D]/80 dark:text-[#F8F7F4]/80 hover:text-[#101E2B] dark:hover:text-[#F8F7F4] px-3 py-1.5 transition-colors">
                Login
              </span>
            </Link>
          )}

          <Link href="/trips/new">
            <Button
              size="sm"
              className="rounded-full bg-[#101E2B] hover:bg-[#172B3A] dark:bg-[#F8F7F4] dark:hover:bg-white text-white dark:text-[#101E2B] font-medium text-xs px-5 py-2 shadow-sm transition-all hover:shadow-md"
            >
              <span>Start Planning</span>
            </Button>
          </Link>
        </div>

        {/* Mobile Quick Action & Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-[#78848C]"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#101E2B] dark:text-[#F8F7F4] rounded-lg focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-sm glass-dock rounded-3xl p-5 border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-[#18232D] dark:text-[#F8F7F4] hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6D9D94]/20 text-[#6D9D94]">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            <Link
              href="/dashboard"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-[#18232D] dark:text-[#F8F7F4] hover:bg-black/5 dark:hover:bg-white/10"
            >
              <span>Travel Desk</span>
            </Link>

            <div className="pt-3 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between gap-3">
              {mounted && user.isAuthenticated ? (
                <button
                  onClick={logout}
                  className="text-xs font-semibold text-red-500 py-2 px-3"
                >
                  Sign Out ({user.fullName.split(" ")[0]})
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#18232D] dark:text-[#F8F7F4] py-2 px-3"
                >
                  Sign In
                </Link>
              )}

              <Link href="/trips/new" className="flex-1">
                <Button className="w-full rounded-full bg-[#101E2B] dark:bg-[#A5C7BA] text-white dark:text-[#101E2B] text-xs">
                  Start Planning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
