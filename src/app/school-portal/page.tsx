import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  Building2, GraduationCap, Bus, FileText, 
  ArrowRight, ShieldCheck, Search, CheckCircle2
} from "lucide-react"

export default async function SchoolPortalRootPage() {
  const session = await auth()

  // Fetch all schools
  const schools = await db.school.findMany({
    include: {
      students: true,
      invoices: true,
      routes: true,
    },
    orderBy: { name: "asc" }
  })

  // If user is a SCHOOL_ADMIN, redirect directly to their assigned school
  if (session?.user?.role === "SCHOOL_ADMIN") {
    const schoolAdmin = await db.schoolAdmin.findFirst({
      where: { userId: session.user.id }
    })
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
          {schools.length === 0 ? (
            <div className="col-span-full bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground space-y-3">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <h3 className="text-lg font-bold text-foreground">No Schools Configured</h3>
              <p className="text-sm max-w-md mx-auto">
                No active school partners are currently registered in the system database.
              </p>
            </div>
          ) : (
            schools.map((school) => {
              const activeStudents = school.students.length
              const activeRoutes = school.routes.length
              const unpaidInvoices = school.invoices.filter(i => i.status !== "PAID").length

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
            })
          )}
        </div>
      </div>
    </div>
  )
}
