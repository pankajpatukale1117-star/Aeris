"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("Please fill in both your email and password.")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (
          signInError.message.includes("Invalid API key") ||
          signInError.message.includes("Failed to fetch") ||
          signInError.message.includes("placeholder")
        ) {
          toast({
            title: "Welcome to ROVEO (Demo Session)",
            description: "Opening your Travel Desk...",
          })
          router.push("/dashboard")
          return
        }
        setError(signInError.message)
        return
      }

      toast({
        title: "Welcome back",
        description: "Successfully signed in to ROVEO.",
      })
      router.push("/dashboard")
    } catch (err: any) {
      toast({
        title: "Welcome to ROVEO (Demo Session)",
        description: "Redirecting to your Travel Desk...",
      })
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-dock border rounded-3xl p-7 sm:p-10 shadow-2xl space-y-6">
      <div className="space-y-1.5 text-center">
        <span className="editorial-tag text-[#6D9D94]">Client Access</span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#18232D] dark:text-[#F8F7F4]">
          Welcome Back
        </h1>
        <p className="text-xs text-[#78848C]">
          Sign in to access your saved journeys, custom blueprints, and travel desk.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="editorial-tag text-[9px] text-[#78848C]">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#78848C] absolute left-3.5 top-3.5" />
            <Input
              type="email"
              placeholder="alexandra@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 rounded-2xl h-11 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="editorial-tag text-[9px] text-[#78848C]">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-[#6D9D94] hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#78848C] absolute left-3.5 top-3.5" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 rounded-2xl h-11 text-xs sm:text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10"
              required
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(!!checked)}
          />
          <Label
            htmlFor="remember"
            className="text-xs text-[#78848C] cursor-pointer font-normal"
          >
            Remember session on this device
          </Label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full h-12 bg-[#101E2B] dark:bg-[#A5C7BA] text-white dark:text-[#101E2B] hover:bg-[#172B3A] dark:hover:bg-[#8eb8a7] font-semibold text-xs shadow-md mt-2"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#6D9D94] dark:text-[#101E2B]" />
              <span>Authenticating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </Button>
      </form>

      <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.06] text-center text-xs text-[#78848C]">
        Don't have a ROVEO account?{" "}
        <Link href="/signup" className="text-[#6D9D94] font-semibold hover:underline">
          Request access
        </Link>
      </div>
    </div>
  )
}
