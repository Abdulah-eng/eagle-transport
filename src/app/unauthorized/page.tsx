import Link from "next/link"
import { ShieldAlert, ArrowLeft, Bus, Lock } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-foreground">Access Restricted</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your current account role does not have authorization to view this portal or route.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" /> Sign In with Different Account
          </Link>
          <Link
            href="/"
            className="w-full py-3 bg-card border border-border text-foreground font-bold text-sm rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  )
}
