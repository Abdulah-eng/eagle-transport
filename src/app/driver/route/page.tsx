import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { 
  MapPin, Clock, Users, Navigation, Bus, 
  ChevronRight, CheckCircle2
} from "lucide-react"

export default async function DriverRoutePage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  let driver: any = null
  try {
    driver = await db.driver.findFirst({
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
                          include: { student: true }
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
  } catch (err) {
    console.error("[DRIVER_ROUTE_DB_ERROR]", err)
  }

  const assignment = driver?.assignments?.[0]
  const run = assignment?.run
  const route = run?.route
  const stops = run?.stops || []

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Bus className="w-3.5 h-3.5" /> Bus Unit #{assignment?.bus?.busNumber || "102"}
          </span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
            Active GPS Route
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold font-heading text-foreground">
            {route?.name || "Route #R-101 (Springfield North)"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {run?.type === "AM" ? "Morning Pick-Up Run" : "Afternoon Drop-Off Run"} • {stops.length} Scheduled Stops
          </p>
        </div>
      </div>

      {/* Stop Sequence List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
          <MapPin className="w-4 h-4 text-primary" /> Stop Navigation Sequence ({stops.length})
        </h2>

        {stops.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground space-y-2">
            <MapPin className="w-10 h-10 mx-auto text-muted-foreground/30" />
            <p className="font-semibold text-foreground text-sm">No Stops Configured</p>
            <p className="text-xs">Your route sequence will be assigned by the dispatcher shortly.</p>
          </div>
        ) : (
          stops.map((stop: any, index: number) => {
            const studentCount = stop.routeAssignments?.length || 3

            return (
              <div key={stop.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                      #{stop.sequence || index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{stop.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {stop.address}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-emerald-600 flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5" /> {stop.estimatedTime || "7:25 AM"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {studentCount} student(s)
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Stop #{index + 1} of {stops.length}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Navigate GPS
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
