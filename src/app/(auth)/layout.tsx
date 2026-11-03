import * as React from "react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8F7F4] dark:bg-[#101E2B] text-[#18232D] dark:text-[#F8F7F4] relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#6D9D94]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#A5C7BA]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="p-6 sm:p-8 flex justify-between items-center relative z-10 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-2xl font-bold tracking-tight text-[#101E2B] dark:text-[#F8F7F4]">
            ROVEO
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#6D9D94]" />
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-wider text-[#78848C] hover:text-[#18232D] dark:hover:text-[#F8F7F4] transition-colors"
        >
          ← Return to Home
        </Link>
      </header>

      {/* Centered Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-[#78848C] relative z-10">
        © {new Date().getFullYear()} ROVEO International Ltd. Protected by modern encryption.
      </footer>
    </div>
  )
}
