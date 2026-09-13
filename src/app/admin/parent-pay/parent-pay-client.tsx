"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  DollarSign, Users, AlertCircle, ShieldAlert, CheckCircle2, 
  Search, RefreshCw, Send, Ban, Plus, Edit2, CreditCard, 
  Sparkles, Filter, Percent
} from "lucide-react"

interface ParentPayAdminClientProps {
  registrations: any[]
  schools: any[]
  credits: any[]
  stats: {
    totalMRR: number
    activeCount: number
    pastDueCount: number
    suspendedCount: number
    totalRegistrations: number
  }
}

export default function ParentPayAdminClient({
  registrations: initialRegistrations,
  schools: initialSchools,
  credits: initialCredits,
  stats,
}: ParentPayAdminClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"subscriptions" | "pricing" | "credits">("subscriptions")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [schoolFilter, setSchoolFilter] = useState<string>("ALL")
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // School Edit Modal State
  const [selectedSchool, setSelectedSchool] = useState<any>(null)
  const [amRate, setAmRate] = useState("")
  const [pmRate, setPmRate] = useState("")
  const [amPmRate, setAmPmRate] = useState("")
  const [siblingDiscount, setSiblingDiscount] = useState("")

  // Credit Modal State
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState("")
  const [creditAmount, setCreditAmount] = useState("")
  const [creditReason, setCreditReason] = useState("")

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Filter registrations
  const filteredRegistrations = initialRegistrations.filter((reg) => {
    const parentName = `${reg.student?.parent?.firstName || ""} ${reg.student?.parent?.lastName || ""}`.toLowerCase()
    const studentName = `${reg.student?.firstName || ""} ${reg.student?.lastName || ""}`.toLowerCase()
    const schoolName = (reg.school?.name || "").toLowerCase()
    const matchesSearch = parentName.includes(search.toLowerCase()) || studentName.includes(search.toLowerCase()) || schoolName.includes(search.toLowerCase())

    const matchesStatus = statusFilter === "ALL" || reg.paymentStatus === statusFilter
    const matchesSchool = schoolFilter === "ALL" || reg.schoolId === schoolFilter

    return matchesSearch && matchesStatus && matchesSchool
  })

  // Action handlers
  const handleBillingAction = async (action: string, payload: any) => {
    setLoadingAction(`${action}-${payload.registrationId || payload.parentId}`)
    try {
      const res = await fetch("/api/admin/parent-pay/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")

      showToast("success", data.message || "Operation completed successfully")
      router.refresh()
    } catch (err: any) {
      showToast("error", err.message || "Failed to execute action")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSchool) return

    setLoadingAction(`save-rates-${selectedSchool.id}`)
    try {
      const res = await fetch("/api/admin/parent-pay/school-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: selectedSchool.id,
          amRate,
          pmRate,
          amPmRate,
          siblingDiscount,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update rates")

      showToast("success", `Updated rates & sibling discount for ${selectedSchool.name}`)
      setSelectedSchool(null)
      router.refresh()
    } catch (err: any) {
      showToast("error", err.message || "Failed to save rates")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleIssueCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParentId || !creditAmount) return

    setLoadingAction("issue-credit")
    try {
      const res = await fetch("/api/admin/parent-pay/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "issue_credit",
          parentId: selectedParentId,
          amount: creditAmount,
          reason: creditReason,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to issue credit")

      showToast("success", data.message)
      setCreditModalOpen(false)
      setCreditAmount("")
      setCreditReason("")
      router.refresh()
    } catch (err: any) {
      showToast("error", err.message || "Failed to issue credit")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 ${
          toastMessage.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toastMessage.text}
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary" />
            Parent Pay & Subscription Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage school transportation rates, parent recurring subscriptions, sibling discounts, and past-due accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreditModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Issue Manual Credit
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Recurring Rev</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            ${stats.totalMRR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Based on active parent subscriptions</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Subscriptions</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.activeCount}</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {stats.totalRegistrations > 0 ? Math.round((stats.activeCount / stats.totalRegistrations) * 100) : 0}% active compliance
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Past Due Accounts</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.pastDueCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Requires automated warning or retry</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Suspended Service</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.suspendedCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Bus access paused due to payment</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border flex gap-4">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "subscriptions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="w-4 h-4" /> Subscriptions & Billing Status
        </button>
        <button
          onClick={() => setActiveTab("pricing")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "pricing"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Percent className="w-4 h-4" /> School Pricing & Sibling Discounts
        </button>
        <button
          onClick={() => setActiveTab("credits")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "credits"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Manual Credits & Adjustments
        </button>
      </div>

      {/* TAB 1: SUBSCRIPTIONS & BILLING STATUS */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search parent, student, or school..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PAID_ACTIVE">Paid & Active</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="PAST_DUE">Past Due</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Schools</option>
                {initialSchools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Student & Parent</th>
                    <th className="p-4">School & Service</th>
                    <th className="p-4">Monthly Rate</th>
                    <th className="p-4">Billing Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No subscription records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => {
                      const parent = reg.student?.parent
                      const settings = reg.school?.settings
                      let rate = 150
                      if (settings) {
                        if (reg.serviceType === "AM_ONLY") rate = Number(settings.amRate) || 120
                        else if (reg.serviceType === "PM_ONLY") rate = Number(settings.pmRate) || 120
                        else rate = Number(settings.amPmRate) || 200
                      }

                      return (
                        <tr key={reg.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-foreground">
                              {reg.student?.firstName} {reg.student?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Parent: {parent?.firstName} {parent?.lastName} ({parent?.email})
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Phone: {parent?.phone1 || "N/A"}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-foreground">{reg.school?.name}</div>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                              {reg.serviceType === "AM_AND_PM" ? "AM + PM Both" : reg.serviceType}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-foreground">${rate.toFixed(2)} / mo</div>
                            {settings?.siblingDiscount > 0 && (
                              <div className="text-xs text-emerald-600 font-medium">
                                Sibling disc: {settings.siblingDiscount}% off multi-child
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {reg.paymentStatus === "PAID_ACTIVE" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Paid & Active
                              </span>
                            )}
                            {reg.paymentStatus === "PENDING_PAYMENT" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600">
                                Pending Payment
                              </span>
                            )}
                            {reg.paymentStatus === "PAST_DUE" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600">
                                <AlertCircle className="w-3.5 h-3.5" /> Past Due
                              </span>
                            )}
                            {reg.paymentStatus === "SUSPENDED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600">
                                <ShieldAlert className="w-3.5 h-3.5" /> Suspended
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Retry Payment Button */}
                              {(reg.paymentStatus === "PAST_DUE" || reg.paymentStatus === "PENDING_PAYMENT") && (
                                <button
                                  disabled={loadingAction === `retry_payment-${reg.id}`}
                                  onClick={() => handleBillingAction("retry_payment", { registrationId: reg.id })}
                                  className="px-2.5 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                                  title="Attempt collection retry"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Retry Pay
                                </button>
                              )}

                              {/* Send Reminder Button */}
                              <button
                                disabled={loadingAction === `send_reminder-${parent?.id}`}
                                onClick={() => handleBillingAction("send_reminder", { parentId: parent?.id })}
                                className="px-2.5 py-1.5 border border-input text-foreground rounded text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1 disabled:opacity-50"
                                title="Send SMS/Email payment reminder"
                              >
                                <Send className="w-3.5 h-3.5 text-blue-500" /> Remind
                              </button>

                              {/* Suspend Service Button */}
                              {reg.paymentStatus !== "SUSPENDED" && (
                                <button
                                  disabled={loadingAction === `suspend_service-${reg.id}`}
                                  onClick={() => handleBillingAction("suspend_service", { registrationId: reg.id })}
                                  className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                                  title="Suspend transportation service"
                                >
                                  <Ban className="w-3.5 h-3.5" /> Suspend
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
        </div>
      )}

      {/* TAB 2: SCHOOL PRICING & SIBLING DISCOUNTS */}
      {activeTab === "pricing" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h2 className="text-base font-bold font-heading text-foreground mb-1">School-Specific Rates & Discounts</h2>
            <p className="text-xs text-muted-foreground">
              Define monthly transport pricing for AM-only, PM-only, AM+PM, and percentage discount applied to sibling registrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialSchools.map((school) => {
              const settings = school.settings || {}
              return (
                <div key={school.id} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-base">{school.name}</h3>
                      <p className="text-xs text-muted-foreground">Code: {school.code}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSchool(school)
                        setAmRate(settings.amRate || "120")
                        setPmRate(settings.pmRate || "120")
                        setAmPmRate(settings.amPmRate || "200")
                        setSiblingDiscount(settings.siblingDiscount || "10")
                      }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Rates
                    </button>
                  </div>

                  <div className="space-y-2 text-sm border-t border-border pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">AM Service Rate:</span>
                      <span className="font-bold text-foreground">${Number(settings.amRate || 120).toFixed(2)} / mo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">PM Service Rate:</span>
                      <span className="font-bold text-foreground">${Number(settings.pmRate || 120).toFixed(2)} / mo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">AM + PM Combined:</span>
                      <span className="font-bold text-primary">${Number(settings.amPmRate || 200).toFixed(2)} / mo</span>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded text-xs font-semibold text-emerald-700">
                      <span>Sibling Discount (2nd+ child):</span>
                      <span>{Number(settings.siblingDiscount || 0)}% OFF</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL CREDITS */}
      {activeTab === "credits" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between">
              <span>Recent Manual Credits & Adjustments</span>
              <span className="text-xs font-normal text-muted-foreground">{initialCredits.length} total entries</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Credit Amount</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Issued By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialCredits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No manual credit records found.
                    </td>
                  </tr>
                ) : (
                  initialCredits.map((c) => (
                    <tr key={c.id}>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-bold text-emerald-600">
                        +${Number(c.amount).toFixed(2)}
                      </td>
                      <td className="p-4 text-foreground">{c.reason}</td>
                      <td className="p-4 text-xs text-muted-foreground">{c.createdBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Edit School Rates */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-heading text-foreground">
              Configure Rates: {selectedSchool.name}
            </h3>
            <form onSubmit={handleSaveRates} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  AM Service Rate ($ / month)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amRate}
                  onChange={(e) => setAmRate(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  PM Service Rate ($ / month)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pmRate}
                  onChange={(e) => setPmRate(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  AM + PM Service Rate ($ / month)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amPmRate}
                  onChange={(e) => setAmPmRate(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Sibling Discount Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={siblingDiscount}
                  onChange={(e) => setSiblingDiscount(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 15 for 15% off 2nd child"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSchool(null)}
                  className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction?.startsWith("save-rates")}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  Save Rates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Issue Manual Credit */}
      {creditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Issue Manual Parent Credit
            </h3>
            <form onSubmit={handleIssueCredit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Select Parent Account
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">-- Choose Parent --</option>
                  {Array.from(
                    new Map(
                      initialRegistrations
                        .map(r => r.student?.parent)
                        .filter(Boolean)
                        .map(p => [p.id, p])
                    ).values()
                  ).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Credit Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50.00"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Reason / Adjustment Note
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Snow day refund, promotional discount, referral bonus..."
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "issue-credit"}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  Apply Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
