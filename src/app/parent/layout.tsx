import { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"
import { 
  Bus, LayoutDashboard, GraduationCap, CreditCard, 
  User, LogOut, Bell, ShieldCheck
} from "lucide-react"

export default async function ParentPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role === "EAGLE_ADMIN" || session.user.role === "OFFICE_STAFF") {
    redirect("/admin/dashboard")
  }

  if (session.user.role !== "PARENT") {
    redirect("/auth/login")
  }

  const navItems = [
    { href: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/parent/students", label: "My Children & Stops", icon: GraduationCap },
    { href: "/parent/payments", label: "Payments & Invoices", icon: CreditCard },
    { href: "/parent/profile", label: "Account Profile", icon: User },
  ]

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/parent/dashboard" className="flex items-center gap-2 text-primary font-heading font-bold text-xl">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <Bus className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span>Eagle Bus</span>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest -mt-1">
                  Parent Portal
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-semibold rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> Verified Parent Account
            </div>

            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                {session.user.name?.charAt(0) || "P"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-foreground leading-tight">{session.user.name}</div>
                <div className="text-[11px] text-muted-foreground leading-tight">{session.user.email}</div>
              </div>
              <a 
                href="/api/auth/logout" 
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden border-t border-border bg-card px-4 py-2 flex items-center justify-around overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary py-1 px-2"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground space-y-1">
          <p>© 2026 Eagle Bus Transportation Management Platform. All rights reserved.</p>
          <p>Need assistance? Contact Eagle Bus Ops Support at (555) 019-2834 or support@eaglebus.com</p>
        </div>
      </footer>
    </div>
  )
}
