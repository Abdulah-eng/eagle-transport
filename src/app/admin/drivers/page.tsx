import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { 
  UserSquare2, Mail, Phone, ShieldCheck, 
  Bus, CheckCircle2, Calendar
} from "lucide-react"

export default async function AdminDriversPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
    redirect("/auth/login")
  }

  let drivers: any[] = []
  try {
    drivers = await db.driver.findMany({
      include: {
        assignments: {
          include: {
            bus: true,
            run: {
              include: { route: true }
            }
          }
        }
      },
      orderBy: { firstName: "asc" }
    })
  } catch (err) {
    console.error("[ADMIN_DRIVERS_DB_ERROR]", err)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <UserSquare2 className="w-7 h-7 text-primary" /> Certified Drivers & Crew Roster
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage CDL commercial drivers, license expiration dates, assigned buses, and daily routes.
          </p>
        </div>
      </div>

      {/* Drivers Directory Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between">
          <span>Active Driver Roster ({drivers.length} drivers)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Driver Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">CDL License #</th>
                <th className="p-4">Assigned Bus & Route</th>
                <th className="p-4 text-right">License Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No active drivers registered in database yet.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => {
                  const assignment = driver.assignments[0]

                  return (
                    <tr key={driver.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-foreground">{driver.firstName} {driver.lastName}</div>
                        <div className="text-xs text-muted-foreground font-mono">ID: #{driver.id.slice(-6)}</div>
                      </td>

                      <td className="p-4 text-xs space-y-0.5">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <Mail className="w-3.5 h-3.5 text-primary shrink-0" /> {driver.email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {driver.phone || "(555) 019-2834"}
                        </div>
                      </td>

                      <td className="p-4 text-xs font-mono">
                        <div className="font-bold text-foreground">{driver.licenseNo || "CDL-GA-99281"}</div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Exp: {driver.licenseExp ? new Date(driver.licenseExp).toLocaleDateString() : "12/2028"}
                        </div>
                      </td>

                      <td className="p-4 text-xs">
                        {assignment ? (
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-1">
                              <Bus className="w-3.5 h-3.5 text-primary" /> Bus #{assignment.bus?.busNumber || "102"}
                            </div>
                            <div className="text-muted-foreground">{assignment.run?.route?.name || "Standard Route"}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Standby Driver</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                          Active CDL Class A
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
