import Link from "next/link"
import { Sparkles, Globe, ArrowUpRight } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#050a10] text-[#f1f5f9] pt-20 pb-12 border-t border-white/[0.1] relative z-10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Top Editorial Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/[0.08]">
          {/* Brand Manifesto */}
          <div className="md:col-span-5 space-y-5">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-editorial text-3xl font-bold tracking-tight text-[#f1f5f9] group-hover:text-[#e8d5b5] transition-colors">
                AERIS
              </span>
              <span className="w-2 h-2 rounded-full bg-[#e8d5b5] shadow-[0_0_8px_rgba(232,213,181,0.8)]" />
            </Link>

            <p className="font-editorial text-xl italic text-[#e8d5b5] max-w-sm font-normal">
              "Your journey. Your rules. Your world."
            </p>

            <p className="text-xs text-[#94a3b8] max-w-sm leading-relaxed">
              AERIS is an art-directed luxury travel technology house designed for discerning travelers who value intention, architectural beauty, and bespoke discovery across the globe.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-semibold tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#38bdf8]" /> AI Engine v2.5
              </span>
              <span className="glass-pill px-3 py-1 rounded-full text-[10px] uppercase font-semibold tracking-widest text-[#94a3b8] flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-[#e8d5b5]" /> Global Atlas
              </span>
            </div>
          </div>

          {/* Links Column 1: Discovery */}
          <div className="md:col-span-2 md:col-start-7 space-y-4">
            <h4 className="editorial-tag text-[#e8d5b5]">
              Discovery
            </h4>
            <ul className="space-y-2.5 text-xs text-[#94a3b8]">
              <li>
                <Link href="/destinations" className="hover:text-[#f1f5f9] transition-colors">
                  Global Atlas
                </Link>
              </li>
              <li>
                <Link href="/destinations?category=Beach" className="hover:text-[#f1f5f9] transition-colors">
                  Archipelagos
                </Link>
              </li>
              <li>
                <Link href="/destinations?category=Mountain" className="hover:text-[#f1f5f9] transition-colors">
                  Alpine Sanctuaries
                </Link>
              </li>
              <li>
                <Link href="/destinations?category=Culture" className="hover:text-[#f1f5f9] transition-colors">
                  Historic Capitals
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Studio */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="editorial-tag text-[#e8d5b5]">
              Trip Studio
            </h4>
            <ul className="space-y-2.5 text-xs text-[#94a3b8]">
              <li>
                <Link href="/ai-planner" className="hover:text-[#f1f5f9] transition-colors flex items-center gap-1">
                  <span>AI Synthesis</span>
                  <ArrowUpRight className="w-3 h-3 text-[#38bdf8]" />
                </Link>
              </li>
              <li>
                <Link href="/manual-planner" className="hover:text-[#f1f5f9] transition-colors">
                  Custom Timeline
                </Link>
              </li>
              <li>
                <Link href="/trips" className="hover:text-[#f1f5f9] transition-colors">
                  Saved Itineraries
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#f1f5f9] transition-colors">
                  Travel Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Perspective */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="editorial-tag text-[#e8d5b5]">
              Perspective
            </h4>
            <ul className="space-y-2.5 text-xs text-[#94a3b8]">
              <li>
                <span className="hover:text-[#f1f5f9] transition-colors cursor-pointer">
                  The Manifesto
                </span>
              </li>
              <li>
                <span className="hover:text-[#f1f5f9] transition-colors cursor-pointer">
                  Liquid UI Design
                </span>
              </li>
              <li>
                <span className="hover:text-[#f1f5f9] transition-colors cursor-pointer">
                  Editorial Journal
                </span>
              </li>
              <li>
                <span className="hover:text-[#f1f5f9] transition-colors cursor-pointer">
                  Private Concierge
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Colophon Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94a3b8]/70">
          <p>© {new Date().getFullYear()} AERIS Travel Architecture Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#f1f5f9] cursor-pointer">Privacy Charter</span>
            <span className="hover:text-[#f1f5f9] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#f1f5f9] cursor-pointer">Security Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
