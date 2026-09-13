"use client"

import { useState } from "react"
import { 
  ShieldCheck, Search, Filter, Clock, User, 
  FileText, Activity, Code, ChevronRight, X
} from "lucide-react"

interface AuditLogsClientProps {
  logs: any[]
}

export default function AuditLogsClient({ logs: initialLogs }: AuditLogsClientProps) {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const filteredLogs = initialLogs.filter((log) => {
    const searchLower = search.toLowerCase()
    const userName = log.user?.name ? log.user.name.toLowerCase() : "system"
    const action = log.action.toLowerCase()
    const entity = log.entity.toLowerCase()

    const matchesSearch = userName.includes(searchLower) || action.includes(searchLower) || entity.includes(searchLower)
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter

    return matchesSearch && matchesAction
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" /> System Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable security and compliance trail of administrative actions, rate changes, payment overrides, and driver dispatch events.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by admin name, action, or target entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Audit Actions</option>
            <option value="RATE_CHANGE">Rate & Pricing Changes</option>
            <option value="RETRY_PAYMENT">Payment Retries</option>
            <option value="SUSPEND_SERVICE">Service Suspensions</option>
            <option value="DRIVER_ASSIGNED">Driver Dispatch</option>
            <option value="QUOTE_CREATED">Charter Quotes</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">IP Address</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No audit records matching your search query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-foreground">
                        {log.user?.name || "System Admin"}
                      </div>
                      <div className="text-xs text-muted-foreground">{log.user?.email || "internal@eaglebus.com"}</div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-primary/10 text-primary">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 text-xs font-medium text-foreground">
                      {log.entity} {log.entityId ? `#${log.entityId.slice(-6)}` : ""}
                    </td>

                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      {log.ipAddress || "127.0.0.1"}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-muted rounded text-primary transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <Code className="w-4 h-4" /> View Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUDIT LOG JSON DIFF MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Audit Payload Detail
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Action:</span>
                <span className="font-mono font-bold text-primary">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User:</span>
                <span className="font-semibold text-foreground">{selectedLog.user?.name || "System"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entity:</span>
                <span className="font-semibold text-foreground">{selectedLog.entity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logged At:</span>
                <span className="font-mono">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="text-xs font-bold text-muted-foreground uppercase">Payload Data / Changes</div>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono overflow-x-auto max-h-60 custom-scrollbar text-foreground">
                {JSON.stringify({ oldValues: selectedLog.oldValues, newValues: selectedLog.newValues }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90"
              >
                Close Payload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
