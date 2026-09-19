"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bus, LayoutDashboard, Building2, Users, FileText, 
  Map, UserSquare2, BusFront, Calendar, Receipt, 
  MessageSquare, AlertTriangle, BarChart3, Settings, LogOut,
  GraduationCap, ShieldCheck, Menu, X 
} from "lucide-react";

interface AdminLayoutWrapperProps {
  children: ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export default function AdminLayoutWrapper({ children, user }: AdminLayoutWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
  ];

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop & Mobile Slide-Over Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col shadow-lg md:shadow-none
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-heading text-xl font-bold">
              <Bus className="w-6 h-6 shrink-0" />
              <span>Eagle Bus Ops</span>
            </div>
            <div className="mt-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Control Center
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm" 
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{user?.name || "Admin User"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.role || "EAGLE_ADMIN"}</p>
            </div>
          </div>
          <a href="/api/auth/logout" className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </a>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar for mobile */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shadow-sm md:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-foreground hover:bg-muted"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="font-heading font-bold text-base text-primary flex items-center gap-2">
              <Bus className="w-5 h-5" /> Eagle Bus
            </div>
          </div>
          <div className="text-xs font-bold text-muted-foreground">
            {user?.name?.split(" ")[0]}
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
