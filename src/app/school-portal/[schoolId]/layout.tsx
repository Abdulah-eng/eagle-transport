import { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/db/client"
import { Bus, LayoutDashboard, Receipt, Map, LogOut } from "lucide-react"

export default async function SchoolPortalLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ schoolId: string }>
}) {
  const resolvedParams = await params
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/login")
  }

  // Verify or resolve school by ID, Code, or fallback to first available school
  let school = resolvedParams.schoolId ? await prisma.school.findFirst({
    where: {
      OR: [
        { id: resolvedParams.schoolId },
        { code: resolvedParams.schoolId.toUpperCase() }
      ]
    }
  }) : null

  if (!school) {
    school = await prisma.school.findFirst()
  }

  const schoolName = school?.name || "School Partner"

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm hidden md:flex">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-heading text-xl font-bold">
            <Bus className="w-6 h-6" />
            <span>Eagle Bus</span>
          </div>
          <div className="mt-4 text-sm font-medium text-muted-foreground truncate">
            {schoolName} Portal
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href={`/school-portal/${resolvedParams.schoolId}`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground text-foreground">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href={`/school-portal/${resolvedParams.schoolId}/trips`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <Map className="w-4 h-4" />
            Field Trips
          </Link>
          <Link href={`/school-portal/${resolvedParams.schoolId}/invoices`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <Receipt className="w-4 h-4" />
            Invoices
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <a href="/api/auth/logout" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            Sign Out
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar for mobile + user info */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
          <div className="md:hidden font-heading font-bold text-lg text-primary">
            Eagle Bus
          </div>
          <div className="hidden md:flex flex-1"></div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{session.user.name}</span>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {session.user.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
