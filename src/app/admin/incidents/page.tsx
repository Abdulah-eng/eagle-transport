import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { 
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, 
  User, Building2, Bus
} from "lucide-react"

export default async function AdminIncidentsPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
    redirect("/auth/login")
  }

  const incidents = await db.incident.findMany({
    include: {
      driver: true,
      student: true,
      school: true,
    },
    orderBy: { date: "desc" }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-destructive" /> Safety & Incident Referral Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review behavioral referrals, safety incidents reported by bus drivers, and office resolution actions.
          </p>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between">
          <span>Logged Incident Reports ({incidents.length} logs)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Incident Type</th>
                <th className="p-4">Reporting Driver</th>
                <th className="p-4">Student & School</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No safety incidents or referrals logged in database.
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      {new Date(incident.date).toLocaleDateString()}
                    </td>

                    <td className="p-4 font-bold text-foreground">
                      {incident.incidentType}
                    </td>

                    <td className="p-4 text-xs">
                      <div className="font-semibold text-foreground">
                        {incident.driver?.firstName} {incident.driver?.lastName}
                      </div>
                    </td>

                    <td className="p-4 text-xs">
                      {incident.student ? (
                        <div className="font-bold text-foreground">
                          {incident.student.firstName} {incident.student.lastName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">General Run Incident</span>
                      )}
                      <div className="text-muted-foreground">{incident.school?.name || "District Shared"}</div>
                    </td>

                    <td className="p-4 text-xs text-muted-foreground max-w-xs truncate">
                      {incident.description}
                    </td>

                    <td className="p-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        incident.status === "RESOLVED" || incident.status === "CLOSED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
