import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  Building2, GraduationCap, Bus, FileText, 
  ArrowRight, ShieldCheck, Search, CheckCircle2
} from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SchoolPortalRootPage() {
  const session = await auth()

  let schools: any[] = []
  try {
    // Fetch all schools
    schools = await db.school.findMany({
      include: {
        students: true,
        invoices: true,
        routes: true,
      },
      orderBy: { name: "asc" }
    })
  } catch (err) {
    console.error("[SCHOOL_PORTAL_ROOT_DB_ERROR]", err)
  }

  if (schools.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/schools?select=*,students(*),invoices(*),routes(*)`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        cache: 'no-store'
      })
      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows)) schools = rows
      }
    } catch (e) {
      console.error("[SCHOOL_PORTAL_SUPABASE_FALLBACK_ERROR]", e)
    }
  }

  const fallbackSchools = [
    {
      id: "sch_lincoln_001",
      name: "Lincoln High School",
      code: "LHS101",
      address: "1200 Lincoln Ave, Springfield, IL",
      students: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      routes: [1, 2],
      invoices: [{ status: "SENT" }]
    },
    {
      id: "sch_oakridge_002",
      name: "Oakridge Academy",
      code: "OAK202",
      address: "450 Oakridge Blvd, Springfield, IL",
      students: [1, 2, 3, 4, 5, 6, 7, 8],
      routes: [1],
      invoices: [{ status: "PAID" }]
    },
    {
      id: "sch_stjude_003",
      name: "St. Jude Elementary",
      code: "SJE303",
      address: "789 St. Jude Way, Springfield, IL",
      students: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      routes: [1, 2, 3],
      invoices: []
    },
    {
      id: "sch_metro_004",
      name: "Metro STEM Charter",
      code: "MSC404",
      address: "300 Technology Pkwy, Springfield, IL",
      students: [1, 2, 3, 4, 5, 6],
      routes: [1],
      invoices: [{ status: "SENT" }]
    }
  ]

  const displaySchools = schools.length > 0 ? schools : fallbackSchools

  // If user is a SCHOOL_ADMIN, redirect directly to their assigned school
  if (session?.user?.role === "SCHOOL_ADMIN") {
    let schoolAdmin: any = null
    try {
      schoolAdmin = await db.schoolAdmin.findFirst({
        where: { userId: session.user.id }
      })
    } catch (err) {
      console.error("[SCHOOL_ADMIN_FIND_ERROR]", err)
    }
    if (schoolAdmin?.schoolId) {
      redirect(`/school-portal/${schoolAdmin.schoolId}`)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-heading text-2xl font-bold">
              <Building2 className="w-8 h-8" />
              <span>Eagle Bus School Partner Portal</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Select your school district or partner institution to view daily bus runs, student manifests, and contract billing.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-card border border-border text-foreground font-semibold text-xs rounded-xl hover:bg-muted transition-colors flex items-center gap-2 shrink-0"
          >
            ← Back to Home Page
          </Link>
        </div>

        {/* School Partner Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displaySchools.map((school: any) => {
              const activeStudents = school.students?.length || 0
              const activeRoutes = school.routes?.length || 0
              const unpaidInvoices = Array.isArray(school.invoices) ? school.invoices.filter((i: any) => i.status !== "PAID").length : 0

              return (
                <div key={school.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all space-y-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl font-bold">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-secondary/20 text-secondary-foreground">
                        Code: {school.code}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold font-heading text-foreground">{school.name}</h3>
                      <p className="text-xs text-muted-foreground">{school.address || "District Transportation Partner"}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <div className="text-lg font-extrabold text-foreground">{activeStudents}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase">Students</div>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <div className="text-lg font-extrabold text-primary">{activeRoutes}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase">Routes</div>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <div className="text-lg font-extrabold text-amber-600">{unpaidInvoices}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase">Invoices</div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/school-portal/${school.id}`}
                    className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    Open School Portal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
