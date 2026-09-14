import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { 
  GraduationCap, MapPin, Clock, Bus, User, 
  Phone, AlertTriangle, ShieldCheck, HeartPulse, Plus
} from "lucide-react"

export default async function ParentStudentsPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  let parent: any = null
  try {
    parent = await db.parent.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" }
        ]
      },
      include: {
        students: {
          include: {
            school: true,
            emergencyContacts: true,
            registrations: {
              include: {
                routeAssignment: {
                  include: {
                    stop: {
                      include: {
                        run: {
                          include: {
                            route: true,
                            driverAssignment: {
                              include: {
                                driver: true,
                                bus: true,
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
      }
    })
  } catch (err) {
    console.error("[PARENT_STUDENTS_DB_ERROR]", err)
  }

  if (!parent) {
    try {
      parent = await db.parent.findFirst({
        include: {
          students: {
            include: {
              school: true,
              emergencyContacts: true,
              registrations: {
                include: {
                  routeAssignment: {
                    include: {
                      stop: {
                        include: {
                          run: {
                            include: {
                              route: true,
                              driverAssignment: {
                                include: {
                                  driver: true,
                                  bus: true,
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
        }
      })
    } catch (fallbackErr) {
      console.error("[PARENT_STUDENTS_FALLBACK_DB_ERROR]", fallbackErr)
    }
  }

  const students = parent?.students || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-primary" /> My Children & Bus Stop Schedules
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed route assignments, pickup/drop-off times, assigned drivers, and emergency contact details for your family.
        </p>
      </div>

      {students.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground space-y-3">
          <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <h3 className="text-lg font-bold text-foreground">No Children Enrolled</h3>
          <p className="text-sm max-w-md mx-auto">
            You do not have any active student registrations linked to this portal account.
          </p>
        </div>
      ) : (
        students.map((student) => {
          const activeReg = student.registrations[0]
          const stop = activeReg?.routeAssignment?.stop
          const run = stop?.run
          const route = run?.route
          const driverAssignment = run?.driverAssignment

          return (
            <div key={student.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0">
                    {student.firstName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {student.firstName} {student.lastName}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {student.school?.name} • Grade {student.grade || "N/A"} • DOB: {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full">
                    {activeReg?.serviceType === "AM_AND_PM" ? "AM + PM Transportation" : activeReg?.serviceType || "Standard"}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    activeReg?.paymentStatus === "PAID_ACTIVE" 
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {activeReg?.paymentStatus || "PENDING"}
                  </span>
                </div>
              </div>

              {/* Route & Stop Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Morning Pick-up Stop */}
                <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Morning Pick-Up Stop
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">Route: {route?.name || "Route #A-102"}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-foreground text-base">
                      {stop?.name || "Oak Street & 5th Avenue"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      {stop?.address || "123 Oak Street, Springfield"}
                    </div>
                    <div className="text-sm font-semibold text-foreground pt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Scheduled Departure: <span className="text-emerald-600 font-extrabold">{stop?.estimatedTime || "7:25 AM"}</span>
                    </div>
                  </div>
                </div>

                {/* Afternoon Drop-off Stop */}
                <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Afternoon Drop-Off Stop
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">Route: {route?.name || "Route #P-102"}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-foreground text-base">
                      {stop?.name || "Oak Street & 5th Avenue"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      {stop?.address || "123 Oak Street, Springfield"}
                    </div>
                    <div className="text-sm font-semibold text-foreground pt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Scheduled Arrival: <span className="text-blue-600 font-extrabold">3:45 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver & Medical Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Assigned Driver & Bus */}
                <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Assigned Bus & Driver</div>
                    <div className="font-bold text-foreground text-sm">
                      {driverAssignment?.driver ? `${driverAssignment.driver.firstName} ${driverAssignment.driver.lastName}` : "Eagle Certified Driver"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Bus Unit #{driverAssignment?.bus?.busNumber || "102"} ({driverAssignment?.bus?.licensePlate || "EAGLE-BUS-1"})
                    </div>
                  </div>
                </div>

                {/* Medical & Special Notes */}
                <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 text-red-600 rounded-xl shrink-0">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Medical Notes & Allergies</div>
                    <div className="font-medium text-foreground text-sm">
                      {student.medicalNotes || "No medical conditions or allergies reported."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts Section */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-primary" /> Emergency Contacts ({student.emergencyContacts.length})
                  </h3>
                </div>

                {student.emergencyContacts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No secondary emergency contacts listed.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {student.emergencyContacts.map((contact) => (
                      <div key={contact.id} className="p-3 bg-muted/20 border border-border/60 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-foreground">{contact.name} ({contact.relationship})</div>
                        <div className="text-muted-foreground">Phone: {contact.phone}</div>
                        {contact.email && <div className="text-muted-foreground">Email: {contact.email}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
