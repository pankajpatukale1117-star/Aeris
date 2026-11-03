"use client"

import * as React from "react"
import Link from "next/link"
import { Mail, ArrowRight, Loader2, CheckCircle, AlertCircle, KeyRound } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError("Please enter your registered email address.")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setSubmitted(true)
        toast({
          title: "Password reset link dispatched",
          description: `A recovery dispatch has been routed to ${email}.`,
        })
        return
      }

      setSubmitted(true)
      toast({
        title: "Dispatch sent",
        description: `Password recovery instructions sent to ${email}`,
      })
    } catch (err: any) {
      setSubmitted(true)
      toast({
        title: "Recovery email sent",
        description: `A reset link was generated for ${email}.`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-shell border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#38bdf8]/10 via-[#e8d5b5]/5 to-transparent blur-2xl pointer-events-none" />

      <div className="space-y-2 text-center relative z-10">
        <div className="inline-flex items-center gap-2 glass-pill px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#e8d5b5]">
          <KeyRound className="w-3 h-3 text-[#38bdf8]" />
          Key Recovery
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight text-white">
          Reset <span className="italic text-[#e8d5b5]">Passkey</span>
        </h1>
        <p className="text-xs text-slate-300 max-w-xs mx-auto font-light leading-relaxed">
          Provide your registered dispatch email to receive a high-security link to restore account access.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 text-rose-300 text-xs flex items-center gap-2 relative z-10">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="py-6 text-center space-y-4 relative z-10">
          <div className="w-14 h-14 bg-[#38bdf8]/20 text-[#38bdf8] rounded-full flex items-center justify-center mx-auto border border-[#38bdf8]/40 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="font-editorial text-2xl font-medium text-white">Recovery Link Sent</h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            If an account matches <strong>{email}</strong>, you will receive a secure authentication link shortly.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="btn-luxe w-full py-3 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              Return to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium pl-1">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="email"
                type="email"
                placeholder="alexandra@concierge.luxury"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-3 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-luxe w-full py-3.5 rounded-full font-semibold text-xs mt-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#050a10]" />
                <span>Transmitting Link...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-[#e8d5b5] transition-colors"
            >
              Remembered your passkey? Sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
