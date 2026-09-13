"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Bus, Lock, Mail, ShieldCheck, ArrowRight, 
  CheckCircle2, AlertCircle, RefreshCw, Sparkles, Building2, UserCheck, GraduationCap
} from "lucide-react"

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || ""

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, callbackUrl }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid email or password")

      // Redirect to target dashboard or returned target URL
      router.push(data.redirectUrl || callbackUrl || "/admin/dashboard")
      router.refresh()
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  // Quick fill helper for demo accounts
  const quickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Glow ambient background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Bus className="w-7 h-7" />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">
            Eagle Bus Sign In
          </h1>
          <p className="text-xs text-muted-foreground">
            Sign in to access your administrative operations, parent portal, or driver manifest.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="admin@eaglebus.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Sign In to Portal
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
              Quick 1-Click Demo Logins
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => quickFill("admin@eaglebus.com", "admin123")}
                className="p-2.5 bg-muted/40 hover:bg-primary/10 border border-border/80 rounded-xl text-foreground hover:text-primary transition-colors text-left flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <div>Eagle Admin</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Full Control</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => quickFill("principal@lincoln.edu", "school123")}
                className="p-2.5 bg-muted/40 hover:bg-amber-500/10 border border-border/80 rounded-xl text-foreground hover:text-amber-600 transition-colors text-left flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div>School Admin</div>
                  <div className="text-[10px] text-muted-foreground font-normal">District Partner</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => quickFill("parent@eaglebus.com", "parent123")}
                className="p-2.5 bg-muted/40 hover:bg-emerald-500/10 border border-border/80 rounded-xl text-foreground hover:text-emerald-600 transition-colors text-left flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div>Parent Account</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Family Pay</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => quickFill("driver@eaglebus.com", "driver123")}
                className="p-2.5 bg-muted/40 hover:bg-purple-500/10 border border-border/80 rounded-xl text-foreground hover:text-purple-600 transition-colors text-left flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <div>Bus Driver</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Mobile Manifest</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Need to submit a trip request? <Link href="/intake" className="text-primary font-bold hover:underline">Book a Charter Bus</Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading authentication portal...</div>}>
      <LoginFormContent />
    </Suspense>
  )
}
