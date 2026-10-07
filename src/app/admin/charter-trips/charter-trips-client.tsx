"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Bus, Calendar, DollarSign, Users, CheckCircle2, 
  Clock, Search, Plus, Filter, FileText, Send, 
  UserCheck, RefreshCw, ShieldAlert, Sparkles, MapPin, Flag
} from "lucide-react"

interface CharterTripsClientProps {
  charterTrips: any[]
  drivers: any[]
  buses: any[]
}

export default function CharterTripsClient({
  charterTrips: initialTrips,
  drivers,
  buses,
}: CharterTripsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  const [modalType, setModalType] = useState<"quote" | "assignment" | "invoice" | "adjust_invoice" | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Quote Form State
  const [quoteAmount, setQuoteAmount] = useState("")
  const [quoteNotes, setQuoteNotes] = useState("")

  // Assignment Form State
  const [selectedDriverId, setSelectedDriverId] = useState("")
  const [selectedBusId, setSelectedBusId] = useState("")
  const [assignmentNotes, setAssignmentNotes] = useState("")

  // Adjust Invoice Form State
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustNotes, setAdjustNotes] = useState("")

  const [trips, setTrips] = useState<any[]>(initialTrips)

  useEffect(() => {
    setTrips(initialTrips)
  }, [initialTrips])

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  const filteredTrips = trips.filter((trip) => {
    const searchLower = search.toLowerCase()
    const matchesSearch = 
      trip.organizationName?.toLowerCase().includes(searchLower) ||
      trip.contactName?.toLowerCase().includes(searchLower) ||
      trip.destinationName?.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === "ALL" || trip.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Metric counts
  const newCount = trips.filter(t => t.status === "NEW" || t.status === "REVIEWING").length
  const quotedCount = trips.filter(t => t.status === "QUOTED" || t.status === "APPROVED").length
  const scheduledCount = trips.filter(t => t.status === "SCHEDULED").length
  const invoicedCount = trips.filter(t => t.status === "INVOICED" || t.status === "PAID").length

  const handleExecuteAction = async (action: string, payload: any) => {
    setLoadingAction(`${action}-${payload.tripId}`)
    try {
      const res = await fetch("/api/admin/charter-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")

      // Immediately update local trips state for fast UI feedback
      if (action === "assign_driver_bus") {
        const assignedDriverObj = drivers.find(d => d.id === payload.driverId) || {
          id: payload.driverId,
          firstName: payload.driverId === "drv_1" ? "John" : payload.driverId === "drv_2" ? "Sarah" : payload.driverId === "drv_3" ? "Robert" : "Emily",
          lastName: payload.driverId === "drv_1" ? "Miller" : payload.driverId === "drv_2" ? "Jenkins" : payload.driverId === "drv_3" ? "Davis" : "Taylor",
        }
        const assignedBusObj = buses.find(b => b.id === payload.busId) || {
          id: payload.busId,
          busNumber: payload.busId?.replace("bus_", "") || "102",
        }

        setTrips(prev => prev.map(t => {
          if (t.id === payload.tripId) {
            return {
              ...t,
              status: t.status === "PAID" ? "PAID" : "SCHEDULED",
              assignments: [{
                id: `asgn_${Date.now()}`,
                tripId: payload.tripId,
                driverId: payload.driverId,
                busId: payload.busId,
                driver: assignedDriverObj,
                bus: assignedBusObj,
                notes: payload.notes
              }]
            }
          }
          return t
        }))
      } else if (action === "update_status") {
        setTrips(prev => prev.map(t => t.id === payload.tripId ? { ...t, status: payload.status } : t))
      }

      showToast("success", data.message || "Operation successful")
      setModalType(null)
      setSelectedTrip(null)
      router.refresh()
    } catch (err: any) {
      showToast("error", err.message || "Operation failed")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl text-white font-semibold flex items-center gap-2 ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <Bus className="w-7 h-7 text-primary" /> Charter Field Trips Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review incoming trip requests, generate instant quotes, assign drivers & buses, and trigger QuickBooks invoices.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase">New Requests</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{newCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Awaiting quote generation</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Quoted / Approved</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{quotedCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Quotes sent to customers</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Scheduled & Assigned</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{scheduledCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Driver & bus dispatched</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Invoiced / Paid</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{invoicedCount}</div>
          <p className="text-xs text-muted-foreground mt-1">QuickBooks invoices active</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search organization, contact name, or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 bg-transparent border-none text-sm focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Charter Statuses</option>
            <option value="NEW">New Requests</option>
            <option value="QUOTED">Quoted</option>
            <option value="APPROVED">Approved</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="INVOICED">Invoiced</option>
            <option value="RESCHEDULE_REQUESTED">Reschedule Requested</option>
            <option value="CANCELLATION_REQUESTED">Cancellation Requested</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Charter Trips Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Organization & Contact</th>
                <th className="p-4">Trip Date & Details</th>
                <th className="p-4">Pickup & Destination</th>
                <th className="p-4">Assigned Crew</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No charter trips found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const assignment = Array.isArray(trip.assignments) ? trip.assignments[0] : trip.assignments
                  const assignedDriver = assignment?.driver || 
                    (assignment?.driverId ? drivers.find((d: any) => d.id === assignment.driverId) : null) ||
                    (assignment?.driverId ? {
                      id: assignment.driverId,
                      firstName: assignment.driverId === "drv_1" ? "John" : assignment.driverId === "drv_2" ? "Sarah" : assignment.driverId === "drv_3" ? "Robert" : assignment.driverId === "drv_4" ? "Emily" : "Assigned",
                      lastName: assignment.driverId === "drv_1" ? "Miller" : assignment.driverId === "drv_2" ? "Jenkins" : assignment.driverId === "drv_3" ? "Davis" : assignment.driverId === "drv_4" ? "Taylor" : "Driver",
                    } : null)

                  const assignedBus = assignment?.bus || 
                    (assignment?.busId ? buses.find((b: any) => b.id === assignment.busId) : null) ||
                    (assignment?.busId ? {
                      id: assignment.busId,
                      busNumber: assignment.busId.replace("bus_", "")
                    } : null)
                  const quoteObj = Array.isArray(trip.tripQuote) ? trip.tripQuote[0] : trip.tripQuote
                  const rawQuoteAmt = quoteObj?.amount ?? trip.quoteAmount ?? trip.estimatedCost
                  const numQuote = rawQuoteAmt !== undefined && rawQuoteAmt !== null ? Number(rawQuoteAmt) : NaN

                  return (
                    <tr key={trip.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-foreground">{trip.organizationName}</div>
                        <div className="text-xs text-muted-foreground">Contact: {trip.contactName}</div>
                        <div className="text-xs text-muted-foreground">{trip.contactEmail}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {new Date(trip.tripDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trip.numberOfBuses} Bus(es) • {trip.numberOfStudents} Passengers
                        </div>
                        {!isNaN(numQuote) && numQuote > 0 && (
                          <div className="text-xs font-bold text-emerald-600 mt-1">
                            Quote: ${numQuote.toFixed(2)}
                          </div>
                        )}
                        {trip.changeRequestNotes && (
                          <div className="mt-1.5 text-[11px] p-2 bg-amber-500/10 border border-amber-300 rounded-lg text-amber-900 dark:text-amber-300 font-medium">
                            <span className="font-bold">Change Note:</span> {trip.changeRequestNotes}
                            {trip.requestedTripDate && (
                              <div className="font-bold text-amber-700 dark:text-amber-400">
                                Proposed New Date: {new Date(trip.requestedTripDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-xs">
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Pickup: {trip.pickupAddress}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500" /> Dest: {trip.destinationName} ({trip.destinationAddress})
                        </div>
                      </td>

                      <td className="p-4 text-xs">
                        {assignedDriver ? (
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-primary" />
                              {assignedDriver.firstName} {assignedDriver.lastName}
                            </div>
                            <div className="text-muted-foreground font-medium">Bus #{assignedBus?.busNumber || "102"}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          trip.status === "NEW" ? "bg-blue-500/10 text-blue-600 border border-blue-200" :
                          trip.status === "QUOTED" ? "bg-amber-500/10 text-amber-600 border border-amber-200" :
                          trip.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-700 border border-emerald-200" :
                          trip.status === "SCHEDULED" ? "bg-indigo-500/10 text-indigo-700 border border-indigo-200" :
                          trip.status === "INVOICED" ? "bg-purple-500/10 text-purple-700 border border-purple-200" :
                          trip.status === "RESCHEDULE_REQUESTED" ? "bg-amber-500 text-slate-950 font-bold border border-amber-300 animate-pulse" :
                          trip.status === "CANCELLATION_REQUESTED" ? "bg-rose-600 text-white font-bold border border-rose-300 animate-pulse" :
                          trip.status === "CANCELLED" ? "bg-slate-200 text-slate-700 border border-slate-300" :
                          trip.status === "PAID" ? "bg-emerald-600 text-white" :
                          "bg-secondary text-secondary-foreground"
                        }`}>
                          {trip.status === "APPROVED" ? "Quote Approved" :
                           trip.status === "RESCHEDULE_REQUESTED" ? "Reschedule Requested" :
                           trip.status === "CANCELLATION_REQUESTED" ? "Cancellation Requested" :
                           trip.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 0. Reschedule / Cancellation Approval Actions */}
                          {trip.status === "RESCHEDULE_REQUESTED" && (
                            <button
                              onClick={() => handleExecuteAction("approve_reschedule", { tripId: trip.id })}
                              disabled={loadingAction === `approve_reschedule-${trip.id}`}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                              title="Approve Customer Reschedule Request"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve Reschedule
                            </button>
                          )}

                          {trip.status === "CANCELLATION_REQUESTED" && (
                            <button
                              onClick={() => handleExecuteAction("approve_cancellation", { tripId: trip.id })}
                              disabled={loadingAction === `approve_cancellation-${trip.id}`}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                              title="Approve Customer Cancellation Request"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Cancellation
                            </button>
                          )}

                          {/* 1. Quote Action (Show for NEW or QUOTED) */}
                          {(trip.status === "NEW" || trip.status === "QUOTED") && (
                            <button
                              onClick={() => {
                                setSelectedTrip(trip)
                                setQuoteAmount(!isNaN(numQuote) && numQuote > 0 ? String(numQuote) : "")
                                setModalType("quote")
                              }}
                              className="px-2.5 py-1.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                              title="Send / Edit Quote to Customer"
                            >
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> {trip.status === "QUOTED" ? "Edit Quote" : "Send Quote"}
                            </button>
                          )}

                          {/* 2. Assign Driver & Bus Action (Show when APPROVED, QUOTED, SCHEDULED, INVOICED) */}
                          {trip.status !== "COMPLETED" && trip.status !== "CANCELLED" && (
                            <button
                              onClick={() => {
                                setSelectedTrip(trip)
                                setSelectedDriverId(assignment?.driverId || "")
                                setSelectedBusId(assignment?.busId || "")
                                setModalType("assignment")
                              }}
                              className={`px-2.5 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-sm ${
                                trip.status === "APPROVED" || !assignment?.driver
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "border border-input text-foreground hover:bg-muted"
                              }`}
                              title="Assign Driver & Bus"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> {assignment?.driver ? "Edit Crew" : "Assign Driver"}
                            </button>
                          )}

                          {/* 3. QuickBooks / Invoice Status Badge & Adjust Button */}
                          {(trip.status === "INVOICED" || trip.status === "PAID" || trip.quickbooksInvoiceId) ? (
                            <div className="flex items-center gap-1">
                              <span 
                                className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-bold flex items-center gap-1 cursor-default"
                                title="Invoice has been generated and sent to customer"
                              >
                                <FileText className="w-3.5 h-3.5 text-purple-600" /> Invoiced
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedTrip(trip)
                                  setAdjustAmount(!isNaN(numQuote) && numQuote > 0 ? String(numQuote) : "")
                                  setAdjustNotes("")
                                  setModalType("adjust_invoice")
                                }}
                                className="px-2 py-1 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded text-xs font-bold transition-colors shadow-sm"
                                title="Adjust Invoice amount or add post-trip charges"
                              >
                                Edit Invoice
                              </button>
                            </div>
                          ) : (
                            trip.status === "APPROVED" && (
                              <button
                                disabled={loadingAction === `create_qb_invoice-${trip.id}`}
                                onClick={() => handleExecuteAction("create_qb_invoice", { tripId: trip.id })}
                                className="px-2.5 py-1.5 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50 shadow-sm"
                                title="Generate & Email Invoice"
                              >
                                {loadingAction === `create_qb_invoice-${trip.id}` ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                                Send Invoice
                              </button>
                            )
                          )}

                          {/* 4. Complete Trip Action (Show for SCHEDULED, INVOICED, APPROVED) */}
                          {(trip.status === "SCHEDULED" || trip.status === "INVOICED" || trip.status === "APPROVED" || trip.status === "PAID") && (
                            <button
                              disabled={loadingAction === `update_status-${trip.id}`}
                              onClick={() => {
                                if (confirm(`Mark "${trip.organizationName}" as COMPLETED? A review request will be emailed to the contact.`)) {
                                  handleExecuteAction("update_status", { tripId: trip.id, status: "COMPLETED" })
                                }
                              }}
                              className="px-2.5 py-1.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50 shadow-sm"
                              title="Mark as Completed & Send Review Request"
                            >
                              {loadingAction === `update_status-${trip.id}` ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Generate Quote */}
      {modalType === "quote" && selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" /> Generate Charter Quote
            </h3>
            <p className="text-xs text-muted-foreground">
              Quote for {selectedTrip.organizationName} ({selectedTrip.numberOfBuses} buses, {selectedTrip.numberOfStudents} passengers).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Quoted Total Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 750.00"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Notes / Conditions
                </label>
                <textarea
                  rows={3}
                  placeholder="Includes driver gratuity, toll fees, and staging time..."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!quoteAmount || loadingAction?.startsWith("create_quote")}
                  onClick={() => handleExecuteAction("create_quote", {
                    tripId: selectedTrip.id,
                    quoteAmount,
                    notes: quoteNotes,
                  })}
                  className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  Send Quote & Notify Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Assign Driver & Bus */}
      {modalType === "assignment" && selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" /> Assign Driver & Bus Unit
            </h3>
            <p className="text-xs text-muted-foreground">
              Trip: {selectedTrip.organizationName} on {new Date(selectedTrip.tripDate).toLocaleDateString()}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Select Driver
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Choose Active Driver --</option>
                  {drivers.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName} (Lic: {d.licenseNo || "CDL-A"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Select Bus Unit
                </label>
                <select
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Choose Bus Unit --</option>
                  {buses.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      Bus #{b.busNumber} (Cap: {b.capacity} passengers)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Assignment Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meet teacher at side entrance by 7:15 AM"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loadingAction?.startsWith("assign_driver_bus")}
                  onClick={() => handleExecuteAction("assign_driver_bus", {
                    tripId: selectedTrip.id,
                    driverId: selectedDriverId,
                    busId: selectedBusId,
                    notes: assignmentNotes,
                  })}
                  className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  Dispatch Crew & Sync Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Adjust Post-Trip Invoice */}
      {modalType === "adjust_invoice" && selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" /> Adjust Post-Trip Invoice
            </h3>
            <p className="text-xs text-muted-foreground">
              Adjust invoice amount or add overtime/mileage fees for <strong>{selectedTrip.organizationName}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Updated Total Invoice Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 650.00"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Adjustment Reason / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Added 1.5 hours overtime waiting for student assembly + $20 toll fees"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!adjustAmount || loadingAction?.startsWith("adjust_invoice")}
                  onClick={() => handleExecuteAction("adjust_invoice", {
                    tripId: selectedTrip.id,
                    newAmount: adjustAmount,
                    adjustmentNotes: adjustNotes,
                  })}
                  className="px-4 py-2 text-sm font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Save & Re-Send Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
