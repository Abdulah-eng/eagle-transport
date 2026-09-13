import { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"
import { Bus, ClipboardList, MapPin, UserSquare2, LogOut } from "lucide-react"

export default async function DriverPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/login")
  }

  // Allow drivers and admins
  if (session.user.role !== "DRIVER" && session.user.role !== "EAGLE_ADMIN") {
    redirect("/unauthorized")
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Mobile Topbar */}
      <header className="h-14 bg-primary text-primary-foreground flex items-center justify-between px-4 shadow-md z-10 shrink-0">
        <div className="flex items-center gap-2 font-bold font-heading text-lg">
          <Bus className="w-5 h-5" />
          Driver Portal
        </div>
        <div className="flex items-center gap-3 text-sm font-medium">
          {session.user.name?.split(' ')[0]}
          <a href="/api/auth/logout" className="p-1.5 hover:bg-primary-foreground/20 rounded-full transition-colors" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main Content Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto bg-muted/20 pb-20">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="h-16 bg-card border-t border-border flex items-center justify-around px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 z-10 fixed bottom-0 w-full">
        <Link href="/driver/dashboard" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors focus:text-primary">
          <ClipboardList className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Dashboard</span>
        </Link>
        <Link href="/driver/manifest" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors focus:text-primary">
          <Bus className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Manifest</span>
        </Link>
        <Link href="/driver/route" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors focus:text-primary">
          <MapPin className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Route GPS</span>
        </Link>
        <Link href="/driver/profile" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors focus:text-primary">
          <UserSquare2 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Profile</span>
        </Link>
      </nav>
    </div>
  )
}
