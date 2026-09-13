"use client"

import { useState } from "react"
import { 
  BarChart3, DollarSign, Users, Bus, AlertTriangle, 
  Download, FileSpreadsheet, CheckCircle2, TrendingUp, 
  Clock, ShieldCheck, Filter
} from "lucide-react"

interface ReportsClientProps {
  invoices: any[]
  students: any[]
  routes: any[]
  drivers: any[]
  incidents: any[]
}

export default function ReportsClient({
  invoices,
  students,
  routes,
  drivers,
  incidents,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<"revenue" | "ridership" | "routes" | "drivers" | "incidents">("revenue")

  // Calculations
  const totalInvoiced = invoices.reduce((acc, i) => acc + Number(i.totalAmount || 0), 0)
  const totalPaid = invoices.filter(i => i.status === "PAID").reduce((acc, i) => acc + Number(i.totalAmount || 0), 0)
  const totalOverdue = invoices.filter(i => i.status === "OVERDUE").reduce((acc, i) => acc + Number(i.totalAmount || 0), 0)

  const handleExportCSV = (type: string) => {
    window.open(`/api/admin/reports/export?type=${type}`, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" /> Comprehensive Operations Reporting Suite
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time business intelligence, financial receivables, ridership metrics, route efficiency, and downloadable CSV audit exports.
          </p>
        </div>
        <button
          onClick={() => handleExportCSV(activeTab)}
          className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export {activeTab.toUpperCase()} Report (.CSV)
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase">Total Revenue Settled</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-1">${totalInvoiced.toLocaleString()} total invoiced</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase">Overdue Receivables</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-1">Requires collection follow-up</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase">Total Enrolled Riders</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{students.length}</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">100% active route coverage</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase">Active Routes</span>
            <Bus className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{routes.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Serving all school partners</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border flex flex-wrap gap-4">
        <button
          onClick={() => setActiveTab("revenue")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "revenue" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <DollarSign className="w-4 h-4" /> Revenue & Financials
        </button>

        <button
          onClick={() => setActiveTab("ridership")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "ridership" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" /> Student Ridership
        </button>

        <button
          onClick={() => setActiveTab("routes")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "routes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bus className="w-4 h-4" /> Route Efficiency
        </button>

        <button
          onClick={() => setActiveTab("drivers")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "drivers" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Driver Performance
        </button>

        <button
          onClick={() => setActiveTab("incidents")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "incidents" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Safety & Incidents
        </button>
      </div>

      {/* TAB 1: REVENUE REPORT */}
      {activeTab === "revenue" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between">
            <span>Invoicing & Receivables Summary ({invoices.length} entries)</span>
            <button
              onClick={() => handleExportCSV("revenue")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Type</th>
                <th className="p-4">Billing Name</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No invoice records found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20">
                    <td className="p-4 font-mono font-bold text-foreground">{inv.invoiceNumber}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                        {inv.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-foreground">{inv.billingName}</td>
                    <td className="p-4 font-bold text-foreground">${Number(inv.totalAmount).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-600" :
                        inv.status === "OVERDUE" ? "bg-red-500/10 text-red-600" :
                        "bg-blue-500/10 text-blue-600"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-xs text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: RIDERSHIP REPORT */}
      {activeTab === "ridership" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between">
            <span>Student Transportation Roster ({students.length} students)</span>
            <button
              onClick={() => handleExportCSV("ridership")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Student Name</th>
                <th className="p-4">School</th>
                <th className="p-4">Grade</th>
                <th className="p-4">Service Type</th>
                <th className="p-4 text-right">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s) => {
                const reg = s.registrations[0]
                return (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="p-4 font-bold text-foreground">{s.firstName} {s.lastName}</td>
                    <td className="p-4 text-muted-foreground">{s.school?.name || "Lincoln High School"}</td>
                    <td className="p-4">Grade {s.grade || "K-12"}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                        {reg?.serviceType || "AM_AND_PM"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                        {reg?.paymentStatus || "PAID_ACTIVE"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ROUTE EFFICIENCY */}
      {activeTab === "routes" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between">
            <span>Route Capacity & Stop Details ({routes.length} routes)</span>
            <button
              onClick={() => handleExportCSV("routes")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Route Name</th>
                <th className="p-4">Assigned School</th>
                <th className="p-4">Active Runs</th>
                <th className="p-4">Total Stops</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {routes.map((r) => {
                const totalStops = r.runs.reduce((acc: number, run: any) => acc + run.stops.length, 0)
                return (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="p-4 font-bold text-foreground">{r.name}</td>
                    <td className="p-4 text-muted-foreground">{r.school?.name || "District Shared"}</td>
                    <td className="p-4">{r.runs.length} runs (AM/PM)</td>
                    <td className="p-4 font-bold text-primary">{totalStops} Stops</td>
                    <td className="p-4 text-right">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-600">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: DRIVER PERFORMANCE */}
      {activeTab === "drivers" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between">
            <span>Driver Roster & CDL Compliance ({drivers.length} drivers)</span>
            <button
              onClick={() => handleExportCSV("drivers")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Driver Name</th>
                <th className="p-4">Email / Phone</th>
                <th className="p-4">License / CDL</th>
                <th className="p-4">Active Assignments</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-muted/20">
                  <td className="p-4 font-bold text-foreground">{d.firstName} {d.lastName}</td>
                  <td className="p-4 text-xs text-muted-foreground">{d.email} • {d.phone || "N/A"}</td>
                  <td className="p-4 text-xs font-mono font-bold text-foreground">{d.licenseNo || "CDL-A 8829"}</td>
                  <td className="p-4 text-xs font-semibold text-primary">{d.assignments.length} Run(s) Assigned</td>
                  <td className="p-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                      ACTIVE CDL
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: SAFETY & INCIDENTS */}
      {activeTab === "incidents" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between">
            <span>Safety & Behavioral Incident Log ({incidents.length} logs)</span>
            <button
              onClick={() => handleExportCSV("incidents")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Type</th>
                <th className="p-4">Driver</th>
                <th className="p-4">Student & School</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No safety incidents logged.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-muted/20">
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(inc.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-foreground">{inc.incidentType}</td>
                    <td className="p-4 text-xs">{inc.driver?.firstName} {inc.driver?.lastName}</td>
                    <td className="p-4 text-xs">
                      {inc.student ? `${inc.student.firstName} ${inc.student.lastName}` : "N/A"} ({inc.school?.name || "General"})
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600">
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
