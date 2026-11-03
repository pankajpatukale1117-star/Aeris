import Link from "next/link"
import { Sparkles, Globe, ArrowUpRight } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#101E2B] text-[#F8F7F4] pt-20 pb-12 border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Top Editorial Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/[0.08]">
          {/* Brand Manifesto */}
          <div className="md:col-span-5 space-y-5">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-display text-3xl font-bold tracking-tight text-[#F8F7F4]">
                ROVEO
              </span>
              <span className="w-2 h-2 rounded-full bg-[#6D9D94]" />
            </Link>

            <p className="font-serif-editorial text-lg italic text-[#A5C7BA] max-w-sm font-normal">
              "Your journey. Your rules. Your world."
            </p>

            <p className="text-xs text-[#78848C] max-w-sm leading-relaxed">
              ROVEO is an art-directed travel technology house designed for discerning individuals who value intention, architectural beauty, and bespoke discovery across the globe.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-semibold tracking-widest bg-white/[0.05] border border-white/[0.08] text-[#A5C7BA]">
                <Sparkles className="w-3 h-3 text-[#6D9D94]" /> AI Engine v2.5
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-semibold tracking-widest bg-white/[0.05] border border-white/[0.08] text-[#78848C]">
                <Globe className="w-3 h-3" /> Global Atlas
              </span>
            </div>
          </div>

          {/* Links Column 1: Discovery */}
          <div className="md:col-span-2 md:col-start-7 space-y-4">
            <h4 className="editorial-tag text-[#A5C7BA]">
              Discovery
            </h4>
            <ul className="space-y-2.5 text-xs text-[#78848C]">
              <li>
                <Link href="/destinations" className="hover:text-[#F8F7F4] transition-colors">
                  Global Atlas
                </Link>
              </li>
              <li>
                <Link href="/destinations?category=Beach" className="hover:text-[#F8F7F4] transition-colors">
                  Archipelagos
                </Link>
              </li>
              <li>
                <Link href="/destinations?category=Mountain" className="hover:text-[#F8F7F4] transition-colors">
                  Alpine Sanctuaries
                </Link>
              </li>
              <li>
                <Link href="/destinations?category=Culture" className="hover:text-[#F8F7F4] transition-colors">
                  Historic Capitals
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Studio */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="editorial-tag text-[#A5C7BA]">
              Trip Studio
            </h4>
            <ul className="space-y-2.5 text-xs text-[#78848C]">
              <li>
                <Link href="/ai-planner" className="hover:text-[#F8F7F4] transition-colors flex items-center gap-1">
                  <span>AI Synthesis</span>
                  <ArrowUpRight className="w-3 h-3 text-[#6D9D94]" />
                </Link>
              </li>
              <li>
                <Link href="/manual-planner" className="hover:text-[#F8F7F4] transition-colors">
                  Custom Timeline
                </Link>
              </li>
              <li>
                <Link href="/trips" className="hover:text-[#F8F7F4] transition-colors">
                  Saved Itineraries
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#F8F7F4] transition-colors">
                  Travel Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Manifesto */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="editorial-tag text-[#A5C7BA]">
              Perspective
            </h4>
            <ul className="space-y-2.5 text-xs text-[#78848C]">
              <li>
                <span className="hover:text-[#F8F7F4] transition-colors cursor-pointer">
                  The Manifesto
                </span>
              </li>
              <li>
                <span className="hover:text-[#F8F7F4] transition-colors cursor-pointer">
                  Editorial Journal
                </span>
              </li>
              <li>
                <span className="hover:text-[#F8F7F4] transition-colors cursor-pointer">
                  Privacy Charter
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Editorial Signoff */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#78848C]">
          <p>© {new Date().getFullYear()} ROVEO International Ltd. Art-directed in Kyoto, Paris & Zurich.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#F8F7F4] cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-[#F8F7F4] cursor-pointer transition-colors">Data Privacy</span>
            <span className="hover:text-[#F8F7F4] cursor-pointer transition-colors">Security Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
