import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { 
  BusFront, Search, ShieldCheck, UserCheck, 
  CheckCircle2, AlertTriangle, Plus, Wrench
} from "lucide-react"

export default async function AdminBusesPage() {
  const session = await auth()
  if (process.env.NODE_ENV !== "development" && (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
    redirect("/auth/login")
  }

  let buses: any[] = []
  try {
    buses = await db.bus.findMany({
      include: {
        driverAssignments: {
          include: { driver: true }
        }
      },
      orderBy: { busNumber: "asc" }
    })
  } catch (err) {
    console.error("[ADMIN_BUSES_DB_ERROR]", err)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <BusFront className="w-7 h-7 text-primary" /> Fleet & Bus Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage transportation fleet units, seating capacity, license plates, VINs, and active driver assignments.
          </p>
        </div>
      </div>

      {/* Buses Directory Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between">
          <span>Active Bus Units ({buses.length} total)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Bus Unit #</th>
                <th className="p-4">Make & Model</th>
                <th className="p-4">Seating Capacity</th>
                <th className="p-4">License Plate / VIN</th>
                <th className="p-4">Assigned Driver</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {buses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No bus units registered in fleet database yet.
                  </td>
                </tr>
              ) : (
                buses.map((bus) => {
                  const driverAssignment = bus.driverAssignments[0]
                  const driver = driverAssignment?.driver

                  return (
                    <tr key={bus.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-bold font-mono text-base text-primary">
                        Bus #{bus.busNumber}
                      </td>

                      <td className="p-4 font-medium text-foreground">
                        {bus.make || "Thomas Built"} {bus.model || "Saf-T-Liner"} ({bus.year || "2024"})
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-foreground">{bus.capacity || 60} Passengers</span>
                        <div className="text-xs text-muted-foreground">Standard School Bus</div>
                      </td>

                      <td className="p-4 text-xs font-mono">
                        <div className="font-bold text-foreground">{bus.licensePlate || "EAGLE-101"}</div>
                        <div className="text-muted-foreground">VIN: {bus.vin || "1HVBBANP9HH12849"}</div>
                      </td>

                      <td className="p-4 text-xs">
                        {driver ? (
                          <div className="font-bold text-foreground flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {driver.firstName} {driver.lastName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {bus.isActive ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                            In Service
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600">
                            Maintenance
                          </span>
                        )}
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
