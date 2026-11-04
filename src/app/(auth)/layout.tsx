import * as React from "react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#050a10] text-[#f1f5f9] relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-[32rem] h-[32rem] bg-gradient-to-br from-[#38bdf8]/15 via-[#e8d5b5]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] bg-gradient-to-tr from-[#050a10] via-[#e8d5b5]/10 to-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="p-6 sm:p-8 flex justify-between items-center relative z-10 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="font-editorial text-2xl font-bold tracking-wider text-[#e8d5b5]">
            ROVEO
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
        </Link>
        <Link
          href="/"
          className="glass-pill px-4 py-2 text-xs uppercase tracking-widest text-slate-300 hover:text-white transition-all hover:border-[#38bdf8]/50"
        >
          ← Return to Sanctuary
        </Link>
      </header>

      {/* Centered Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 relative z-10">
        © {new Date().getFullYear()} ROVEO International Concierge. High-fidelity cryptographic session security.
      </footer>
    </div>
  )
}
