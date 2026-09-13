"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Clock, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface RegistrationsClientProps {
  registrations: any[];
}

export default function RegistrationsClient({ registrations: initialRegistrations }: RegistrationsClientProps) {
  const router = useRouter();
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const filteredRegistrations = initialRegistrations.filter((reg) => {
    const searchLower = search.toLowerCase();
    const studentName = `${reg.student?.firstName || ''} ${reg.student?.lastName || ''}`.toLowerCase();
    const schoolName = (reg.school?.name || '').toLowerCase();
    const schoolCode = (reg.schoolCode || '').toLowerCase();
    const parentEmail = (reg.student?.parent?.email || '').toLowerCase();

    const matchesSearch = studentName.includes(searchLower) || schoolName.includes(searchLower) || schoolCode.includes(searchLower) || parentEmail.includes(searchLower);
    const matchesStatus = statusFilter === "ALL" || reg.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (registrationId: string, newStatus: "APPROVED" | "REJECTED") => {
    setLoadingId(`${registrationId}-${newStatus}`);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      showToast("success", data.message || `Registration ${newStatus === 'APPROVED' ? 'Approved' : 'Declined'} successfully`);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update registration");
    } finally {
      setLoadingId(null);
    }
  };

  const pendingCount = initialRegistrations.filter(r => r.status === "PENDING_REVIEW").length;
  const approvedCount = initialRegistrations.filter(r => r.status === "APPROVED").length;
  const waitlistedCount = initialRegistrations.filter(r => r.status === "WAITLISTED").length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl text-white font-semibold flex items-center gap-2 ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Student Registrations</h1>
          <p className="text-muted-foreground mt-1">Review, approve, or waitlist incoming transportation requests.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {[
          { label: "All Registrations", value: "ALL", count: initialRegistrations.length },
          { label: "Pending Review", value: "PENDING_REVIEW", count: pendingCount, color: "text-amber-600 bg-amber-50" },
          { label: "Approved", value: "APPROVED", count: approvedCount, color: "text-emerald-600 bg-emerald-50" },
          { label: "Waitlisted", value: "WAITLISTED", count: waitlistedCount, color: "text-blue-600 bg-blue-50" },
          { label: "Rejected", value: "REJECTED", count: initialRegistrations.filter(r => r.status === "REJECTED").length },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === tab.value 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab.color || "bg-slate-200 text-slate-800"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, school code, or parent email..." 
              className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background text-xs"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Date Submitted</th>
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Service Info</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRegistrations.map((reg) => {
                const isLoadingApprove = loadingId === `${reg.id}-APPROVED`;
                const isLoadingDecline = loadingId === `${reg.id}-REJECTED`;

                return (
                  <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground font-medium text-xs">
                      {new Date(reg.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{reg.student?.firstName} {reg.student?.lastName}</div>
                      <div className="text-xs text-muted-foreground">{reg.school?.name || `School Code: ${reg.schoolCode}`}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border">
                        {reg.serviceType === "AM_AND_PM" ? "AM + PM BOTH" : reg.serviceType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {reg.status === "APPROVED" ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                          Approved
                        </span>
                      ) : reg.status === "WAITLISTED" ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 border-amber-200">
                          Waitlisted
                        </span>
                      ) : reg.status === "REJECTED" ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border-rose-200">
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          disabled={isLoadingApprove || isLoadingDecline || reg.status === "APPROVED"}
                          onClick={() => handleUpdateStatus(reg.id, "APPROVED")}
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200 disabled:opacity-50"
                        >
                          {isLoadingApprove ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </Button>

                        <Button 
                          disabled={isLoadingApprove || isLoadingDecline || reg.status === "REJECTED"}
                          onClick={() => handleUpdateStatus(reg.id, "REJECTED")}
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1 text-xs font-bold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200 disabled:opacity-50"
                        >
                          {isLoadingDecline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          Decline
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-10 h-10 text-muted-foreground opacity-20 mb-3" />
                      <p className="font-semibold text-sm">No registration requests found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
