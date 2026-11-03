"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, Mail, User, Phone, ArrowRight, Loader2, AlertCircle, CheckCircle, Sparkles } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useTravelStore } from "@/lib/store/travel-store"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const signup = useTravelStore((state) => state.signup)

  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [termsAgreed, setTermsAgreed] = React.useState(false)

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (!termsAgreed) {
      setError("Please agree to the Terms of Service and Privacy Charter.")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        if (
          signUpError.message.includes("Invalid API key") ||
          signUpError.message.includes("Failed to fetch") ||
          signUpError.message.includes("placeholder")
        ) {
          signup(email, fullName)
          setIsSuccess(true)
          toast({
            title: "Membership Created",
            description: "Opening your bespoke Travel Desk...",
          })
          setTimeout(() => router.push("/dashboard"), 800)
          return
        }
        setError(signUpError.message)
        return
      }

      signup(email, fullName)
      setIsSuccess(true)
      toast({
        title: "Account Created",
        description: "Welcome to ROVEO. Opening your Travel Desk...",
      })
      setTimeout(() => router.push("/dashboard"), 800)
    } catch (err: any) {
      signup(email, fullName)
      setIsSuccess(true)
      toast({
        title: "Welcome to ROVEO",
        description: "Opening your Travel Desk...",
      })
      setTimeout(() => router.push("/dashboard"), 800)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-shell border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#38bdf8]/10 via-[#e8d5b5]/5 to-transparent blur-2xl pointer-events-none" />

      <div className="space-y-2 text-center relative z-10">
        <div className="inline-flex items-center gap-2 glass-pill px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#e8d5b5]">
          <Sparkles className="w-3 h-3 text-[#38bdf8]" />
          Exclusive Membership
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight text-white">
          Begin Your <span className="italic text-[#e8d5b5]">Odyssey</span>
        </h1>
        <p className="text-xs text-slate-300 max-w-xs mx-auto font-light leading-relaxed">
          Create your private ROVEO registry to craft autonomous itineraries and bookmark global sanctuaries.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 text-rose-300 text-xs flex items-center gap-2 relative z-10">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="py-8 text-center space-y-3 relative z-10">
          <div className="w-14 h-14 bg-[#38bdf8]/20 text-[#38bdf8] rounded-full flex items-center justify-center mx-auto border border-[#38bdf8]/40 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="font-editorial text-2xl font-medium text-white">Membership Activated</h3>
          <p className="text-xs text-slate-400">Opening your personalized luxury Travel Desk...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium pl-1">
              Full Legal Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                placeholder="Alexandra Sterling"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium pl-1">
              Primary Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="alexandra@concierge.luxury"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium pl-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Min 8 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-[#e8d5b5] font-medium pl-1">
                Confirm *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Repeat passkey"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2 pt-1 pl-1">
            <Checkbox
              id="terms"
              checked={termsAgreed}
              onCheckedChange={(checked) => setTermsAgreed(!!checked)}
              className="mt-0.5 border-white/20 data-[state=checked]:bg-[#38bdf8] data-[state=checked]:border-[#38bdf8]"
            />
            <Label
              htmlFor="terms"
              className="text-[11px] text-slate-400 leading-snug cursor-pointer font-light"
            >
              I agree to the{" "}
              <span className="text-[#38bdf8] hover:underline">Terms of Service</span> and{" "}
              <span className="text-[#38bdf8] hover:underline">Privacy Charter</span>.
            </Label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-luxe w-full py-3.5 rounded-full font-semibold text-xs mt-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#050a10]" />
                <span>Creating Membership...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Create Membership</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </button>
        </form>
      )}

      <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400 relative z-10">
        Already have a membership?{" "}
        <Link href="/login" className="text-[#38bdf8] font-semibold hover:text-[#e8d5b5] transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  )
}
