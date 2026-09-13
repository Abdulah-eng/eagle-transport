import { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"
import { 
  Bus, LayoutDashboard, Building2, Users, FileText, 
  Map, UserSquare2, BusFront, Calendar, Receipt, 
  MessageSquare, AlertTriangle, BarChart3, Settings, LogOut,
  GraduationCap, ShieldCheck
} from "lucide-react"

export default async function AdminPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  
  if (process.env.NODE_ENV !== "development" && (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
    redirect("/auth/login")
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/schools", label: "Schools", icon: Building2 },
    { href: "/admin/students", label: "Students", icon: GraduationCap },
    { href: "/admin/parents", label: "Parents", icon: Users },
    { href: "/admin/registrations", label: "Registrations", icon: FileText },
    { href: "/admin/routes", label: "Routes & Stops", icon: Map },
    { href: "/admin/buses", label: "Fleet & Buses", icon: BusFront },
    { href: "/admin/drivers", label: "Drivers", icon: UserSquare2 },
    { href: "/admin/charter-trips", label: "Charter Trips", icon: Bus },
    { href: "/admin/calendar", label: "Operations Calendar", icon: Calendar },
    { href: "/admin/parent-pay", label: "Parent Pay", icon: Receipt },
    { href: "/admin/messages", label: "Messaging", icon: MessageSquare },
    { href: "/admin/incidents", label: "Incidents", icon: AlertTriangle },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ShieldCheck },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm hidden md:flex">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-heading text-xl font-bold">
            <Bus className="w-6 h-6" />
            <span>Eagle Bus Ops</span>
          </div>
          <div className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Control Center
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-3">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                {session?.user?.name?.charAt(0) || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{session?.user?.name || "Admin User"}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.role || "EAGLE_ADMIN"}</p>
              </div>
          </div>
          <a href="/api/auth/logout" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar for mobile */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm md:hidden">
          <div className="font-heading font-bold text-lg text-primary flex items-center gap-2">
            <Bus className="w-5 h-5" /> Eagle Bus
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
