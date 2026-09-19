"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, LayoutDashboard, Receipt, Map, LogOut, Menu, X } from "lucide-react";

interface SchoolLayoutWrapperProps {
  children: ReactNode;
  schoolId: string;
  schoolName: string;
  userName?: string | null;
}

export default function SchoolLayoutWrapper({
  children,
  schoolId,
  schoolName,
  userName,
}: SchoolLayoutWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { href: `/school-portal/${schoolId}`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/school-portal/${schoolId}/trips`, label: "Field Trips", icon: Map },
    { href: `/school-portal/${schoolId}/invoices`, label: "Invoices & Statements", icon: Receipt },
  ];

  return (
    <div className="flex h-screen bg-muted/20 font-sans overflow-hidden">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col shadow-lg md:shadow-none
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-heading text-xl font-bold">
              <Bus className="w-6 h-6 shrink-0" />
              <span>Eagle Bus</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-muted-foreground truncate max-w-[180px]">
              {schoolName}
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-card/50">
          <a href="/api/auth/logout" className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="font-heading font-bold text-base text-primary md:hidden">
              Eagle Bus
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-bold text-foreground">{userName || "School Admin"}</span>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {userName?.charAt(0) || "S"}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
