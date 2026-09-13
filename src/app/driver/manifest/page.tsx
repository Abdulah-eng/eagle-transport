import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { 
  UserCheck, Bus, MapPin, Phone, AlertTriangle, 
  CheckCircle2, XCircle
} from "lucide-react"

export default async function DriverManifestPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  // Fetch driver assignments and student manifest
  const driver = await db.driver.findFirst({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email || "" }
      ]
    },
    include: {
      assignments: {
        include: {
          bus: true,
          run: {
            include: {
              route: true,
              stops: {
                orderBy: { sequence: "asc" },
                include: {
                  routeAssignments: {
                    include: {
                      registration: {
                        include: {
                          student: {
                            include: { parent: true }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  const assignment = driver?.assignments?.[0]
  const run = assignment?.run
  const route = run?.route
  const stops = run?.stops || []

  // Collect all students from route stops or sample roster if DB empty
  let roster: any[] = []

  stops.forEach((stop: any) => {
    stop.routeAssignments?.forEach((ra: any) => {
      const student = ra.registration?.student
      const parent = student?.parent
      if (student) {
        roster.push({
          id: ra.id,
          studentName: `${student.firstName || "Student"} ${student.lastName || ""}`,
          grade: student.grade || "N/A",
          stopName: stop.name,
          parentName: parent ? `${parent.firstName || "Parent"} ${parent.lastName || ""}` : "Parent",
          parentPhone: parent?.phone1 || "(704) 606-5661",
          allergies: student.medicalNotes || "None",
          status: "Scheduled"
        })
      }
    })
  })

  // Fallback demo roster if database has no active route assignments
  if (roster.length === 0) {
    roster = [
      { id: "st-1", studentName: "Alexander Wright", grade: "3rd Grade", stopName: "Birkdale Village Stop", parentName: "Sarah Wright", parentPhone: "(704) 555-0192", allergies: "Peanut Allergy", status: "Boarded" },
      { id: "st-2", studentName: "Emily Davis", grade: "1st Grade", stopName: "Birkdale Village Stop", parentName: "Mark Davis", parentPhone: "(704) 555-0144", allergies: "None", status: "Boarded" },
      { id: "st-3", studentName: "Jacob Martinez", grade: "5th Grade", stopName: "Highland Creek Clubhouse", parentName: "Elena Martinez", parentPhone: "(704) 555-0821", allergies: "Asthma", status: "Scheduled" },
      { id: "st-4", studentName: "Sophia Johnson", grade: "2nd Grade", stopName: "Highland Creek Clubhouse", parentName: "Robert Johnson", parentPhone: "(704) 555-0932", allergies: "Bee Stings", status: "Scheduled" },
      { id: "st-5", studentName: "Liam Smith", grade: "K", stopName: "Huntersville Commons", parentName: "Jennifer Smith", parentPhone: "(704) 555-0311", allergies: "None", status: "Absent" },
    ]
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      
      {/* Route & Vehicle Header */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Driver Live Roster</span>
              <h1 className="text-xl font-bold font-heading text-foreground">
                {route?.name || "Route #R-101 (LNC Morning Express)"}
              </h1>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" /> Live Boarding
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center pt-2 border-t border-border">
          <div className="p-3 bg-muted/30 rounded-2xl">
            <div className="text-xs text-muted-foreground">Total Riders</div>
            <div className="text-lg font-extrabold text-foreground">{roster.length}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
            <div className="text-xs font-semibold">Boarded</div>
            <div className="text-lg font-extrabold">{roster.filter(r => r.status === "Boarded").length}</div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
            <div className="text-xs font-semibold">Remaining</div>
            <div className="text-lg font-extrabold">{roster.filter(r => r.status === "Scheduled").length}</div>
          </div>
        </div>
      </div>

      {/* Student Roster Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" /> Student Boarding Roster ({roster.length})
          </h2>
          <span className="text-xs text-muted-foreground">Tap student to check-in</span>
        </div>

        <div className="space-y-3">
          {roster.map((student: any) => (
            <div 
              key={student.id} 
              className={`bg-card border rounded-2xl p-4 shadow-sm transition-all space-y-3 ${
                student.status === "Boarded" 
                  ? "border-emerald-500/40 bg-emerald-500/5" 
                  : student.status === "Absent"
                  ? "border-rose-500/40 bg-rose-500/5 opacity-70"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">{student.studentName}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase">
                      {student.grade}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {student.stopName}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    student.status === "Boarded" 
                      ? "bg-emerald-500 text-white" 
                      : student.status === "Absent"
                      ? "bg-rose-500 text-white"
                      : "bg-muted text-foreground"
                  }`}>
                    {student.status === "Boarded" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {student.status === "Absent" && <XCircle className="w-3.5 h-3.5" />}
                    {student.status}
                  </span>
                </div>
              </div>

              {/* Medical Alerts & Parent Contact */}
              <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {student.allergies !== "None" && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {student.allergies}
                    </span>
                  )}
                  <span className="text-muted-foreground">Parent: <strong>{student.parentName}</strong></span>
                </div>

                <a 
                  href={`tel:${student.parentPhone.replace(/[^0-9]/g, "")}`} 
                  className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Parent
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
