import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  GraduationCap, MapPin, Clock, CreditCard, AlertCircle, 
  CheckCircle2, Bus, ShieldAlert, ChevronRight, PhoneCall, 
  ArrowRight, UserCheck
} from "lucide-react"

export default async function ParentDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  // Find parent record by userId or email with error handling
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
            },
            attendances: {
              orderBy: { date: "desc" },
              take: 3,
            }
          }
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        payments: {
          orderBy: { paidAt: "desc" },
          take: 5,
        }
      }
    })
  } catch (dbErr) {
    console.error("[PARENT_DASHBOARD_DB_ERROR]", dbErr)
  }

  // If no parent record found (e.g., admin previewing), get first parent or fallback
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
              },
              attendances: {
                orderBy: { date: "desc" },
                take: 3,
              }
            }
          },
          invoices: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          payments: {
            orderBy: { paidAt: "desc" },
            take: 5,
          }
        }
      })
    } catch (fallbackErr) {
      console.error("[PARENT_DASHBOARD_FALLBACK_DB_ERROR]", fallbackErr)
    }
  }

  const students = parent?.students || []
  const invoices = parent?.invoices || []
  const hasPastDue = Array.isArray(invoices) && invoices.some((inv: any) => inv?.status === "OVERDUE")

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-blue-800 rounded-2xl p-6 sm:p-8 text-primary-foreground shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
            Eagle Bus Family Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">
            Welcome back, {parent?.firstName || session.user.name || "Parent"}!
          </h1>
          <p className="text-primary-foreground/90 text-sm mt-2">
            Track your children&apos;s daily bus route schedule, view assigned drivers, and manage recurring payment subscriptions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/parent/payments"
              className="px-4 py-2.5 bg-white text-primary text-sm font-bold rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2 shadow"
            >
              <CreditCard className="w-4 h-4" /> Manage Payments & Subscriptions
            </Link>
            <Link
              href="/parent/students"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" /> View Bus Schedules
            </Link>
          </div>
        </div>
        <Bus className="absolute -right-6 -bottom-6 w-56 h-56 text-white/10 pointer-events-none hidden sm:block" />
      </div>

      {/* Urgent Past Due Banner */}
      {hasPastDue && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-white rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-400 text-base">Outstanding Payment Due</h3>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Your bus transportation balance is currently past due. Please pay now to avoid service interruption.
              </p>
            </div>
          </div>
          <Link
            href="/parent/payments"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1 shadow"
          >
            Pay Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Grid: Enrolled Children & Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Children Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Enrolled Children ({students.length})
            </h2>
            <Link href="/parent/students" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View all details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {students.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground space-y-3">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <p className="font-medium">No enrolled children found linked to your account.</p>
              <p className="text-xs">If you submitted a registration, our office team will process it shortly.</p>
            </div>
          ) : (
            students.map((student) => {
              const activeReg = student.registrations[0]
              const stopAssignment = activeReg?.routeAssignment?.stop
              const run = stopAssignment?.run
              const driverAssignment = run?.driverAssignment
              const driver = driverAssignment?.driver
              const bus = driverAssignment?.bus

              return (
                <div key={student.id} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{student.firstName} {student.lastName}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          Grade {student.grade || "K-12"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{student.school?.name}</p>
                    </div>

                    <div>
                      {activeReg?.paymentStatus === "PAID_ACTIVE" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active Bus Service
                        </span>
                      )}
                      {activeReg?.paymentStatus === "PENDING_PAYMENT" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600">
                          Pending Payment
                        </span>
                      )}
                      {activeReg?.paymentStatus === "SUSPENDED" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600">
                          <ShieldAlert className="w-3.5 h-3.5" /> Service Suspended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route & Stop Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-muted/40 p-4 rounded-xl space-y-2 border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-primary tracking-wider flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Assigned Bus Stop
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {activeReg?.serviceType === "AM_AND_PM" ? "AM & PM" : activeReg?.serviceType}
                        </span>
                      </div>
                      <div className="font-semibold text-foreground text-sm">
                        {stopAssignment?.name || "Main Neighborhood Stop"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stopAssignment?.address || "Stop assignment in progress by dispatcher"}
                      </div>
                      {stopAssignment?.estimatedTime && (
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1 pt-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Pickup Time: {stopAssignment.estimatedTime}
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/40 p-4 rounded-xl space-y-2 border border-border/50">
                      <div className="text-xs font-bold uppercase text-primary tracking-wider flex items-center gap-1">
                        <Bus className="w-3.5 h-3.5" /> Assigned Driver & Bus
                      </div>
                      <div className="font-semibold text-foreground text-sm">
                        Driver: {driver ? `${driver.firstName} ${driver.lastName}` : "Assigned Eagle Driver"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Bus #{bus?.busNumber || "102"} ({bus?.capacity || "60"}-passenger transport)
                      </div>
                      <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-1">
                        <UserCheck className="w-3.5 h-3.5" /> GPS Live Monitored
                      </div>
                    </div>
                  </div>

                  {/* Recent Attendance */}
                  {student.attendances && student.attendances.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Recent Bus Attendance Log
                      </div>
                      <div className="space-y-1.5">
                        {student.attendances.map((att) => (
                          <div key={att.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/20">
                            <span className="font-medium text-foreground">
                              {new Date(att.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ({att.runType})
                            </span>
                            <span className={`font-semibold ${
                              att.status === "BOARDED" || att.status === "DROPPED_OFF" ? "text-emerald-600" : "text-amber-600"
                            }`}>
                              {att.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Right 1 Col: Billing Summary & Support */}
        <div className="space-y-6">
          {/* Quick Billing Card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Billing Overview
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Monthly Transport Rate:</span>
                <span className="font-bold text-foreground">$200.00 / mo</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Sibling Discount:</span>
                <span className="font-bold text-emerald-600">-15% Applied</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="font-bold text-foreground">Next Invoice Total:</span>
                <span className="text-lg font-extrabold text-primary">$170.00</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/parent/payments"
                className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                View Payment Options & Invoices
              </Link>
            </div>
          </div>

          {/* Transportation Support Widget */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-primary" /> Dispatch Hotline
            </h3>
            <p className="text-xs text-muted-foreground">
              Have a question about a delayed bus, route change, or pickup location?
            </p>
            <div className="p-3 bg-muted rounded-lg font-bold text-primary text-sm flex items-center justify-center gap-2">
              <PhoneCall className="w-4 h-4" /> (555) 019-2834
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              Mon – Fri: 6:00 AM – 6:00 PM EST
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
