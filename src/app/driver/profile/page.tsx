import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { 
  UserSquare2, Mail, Phone, ShieldCheck, 
  Bus, CheckCircle2, Calendar, ClipboardCheck
} from "lucide-react"

export default async function DriverProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

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
            include: { route: true }
          }
        }
      }
    }
  })

  const assignment = driver?.assignments[0]
  const bus = assignment?.bus

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Driver Info Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl flex items-center justify-center shrink-0 shadow-md">
            {driver?.firstName?.charAt(0) || session.user.name?.charAt(0) || "D"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {driver ? `${driver.firstName} ${driver.lastName}` : session.user.name}
            </h1>
            <p className="text-xs text-muted-foreground">{driver?.email || session.user.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" /> Commercial CDL Class A Certified
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-muted/30 rounded-xl space-y-1">
            <div className="text-muted-foreground font-semibold">CDL License #</div>
            <div className="font-bold font-mono text-foreground">{driver?.licenseNo || "CDL-GA-99281"}</div>
          </div>

          <div className="p-3 bg-muted/30 rounded-xl space-y-1">
            <div className="text-muted-foreground font-semibold">Phone Contact</div>
            <div className="font-bold text-foreground">{driver?.phone || "(555) 019-2834"}</div>
          </div>
        </div>
      </div>

      {/* Vehicle Check Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold font-heading text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Bus className="w-5 h-5 text-primary" /> Assigned Vehicle Details
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Assigned Bus Unit:</span>
            <span className="font-bold text-primary text-base">Bus #{bus?.busNumber || "102"}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Make / Model / Year:</span>
            <span className="font-semibold text-foreground">{bus?.make || "Thomas Built"} {bus?.model || "Saf-T-Liner"} ({bus?.year || 2024})</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">License Plate:</span>
            <span className="font-mono font-bold text-foreground">{bus?.licensePlate || "EAGLE-BUS-1"}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Passenger Capacity:</span>
            <span className="font-bold text-foreground">{bus?.capacity || 60} Passengers</span>
          </div>
        </div>
      </div>

      {/* Daily Inspection Checklist */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold font-heading text-foreground flex items-center gap-2 border-b border-border pb-3">
          <ClipboardCheck className="w-5 h-5 text-emerald-600" /> Daily Pre-Trip Safety Inspection
        </h2>

        <div className="space-y-2 text-xs">
          {[
            "Brakes, tires, and steering operation verified",
            "Emergency exits, doors, and stop arms checked",
            "First aid kit, fire extinguisher, and safety triangles present",
            "Student seatbelts and passenger seats clean and disinfected",
            "GPS tracking unit and two-way radio powered on"
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-emerald-500/10 text-emerald-700 rounded-xl font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
