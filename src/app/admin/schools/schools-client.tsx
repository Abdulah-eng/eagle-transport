"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, Plus, Settings2, MoreHorizontal, ExternalLink, 
  Copy, Trash2, CheckCircle2, AlertCircle, Loader2, X, DollarSign 
} from "lucide-react";

interface SchoolsClientProps {
  schools: any[];
}

export default function SchoolsClient({ schools: initialSchools }: SchoolsClientProps) {
  const router = useRouter();
  const [schools, setSchools] = useState(initialSchools);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Add School Form
  const [addForm, setAddForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    maxCapacityPerBus: 60,
    amRate: 150,
    pmRate: 150,
    amPmRate: 250,
    siblingDiscount: 10,
  });

  // Configure Rates Form
  const [rateForm, setRateForm] = useState({
    maxCapacityPerBus: 60,
    amRate: 150,
    pmRate: 150,
    amPmRate: 250,
    siblingDiscount: 10,
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create school");

      showToast("success", data.message || "School created successfully!");
      setIsAddOpen(false);
      setAddForm({
        name: "", code: "", address: "", phone: "", email: "",
        maxCapacityPerBus: 60, amRate: 150, pmRate: 150, amPmRate: 250, siblingDiscount: 10
      });
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/schools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: selectedSchool.id,
          ...rateForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update rates");

      showToast("success", "School billing rates updated successfully!");
      setIsRateOpen(false);
      setSelectedSchool(null);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (schoolId: string) => {
    try {
      const res = await fetch("/api/admin/schools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, action: "toggle_active" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("success", data.message);
      setOpenDropdownId(null);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
    if (!confirm(`Are you sure you want to delete "${schoolName}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/schools?id=${schoolId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("success", "School deleted successfully");
      setOpenDropdownId(null);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const copyPortalLink = (schoolId: string) => {
    const url = `${window.location.origin}/school-portal/${schoolId}`;
    navigator.clipboard.writeText(url);
    showToast("success", "School portal link copied to clipboard!");
    setOpenDropdownId(null);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl text-white font-semibold flex items-center gap-2 ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.text}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Schools Management</h1>
          <p className="text-muted-foreground mt-1">Manage school partner contracts, registration codes, and rate configurations.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="shrink-0 gap-2 bg-primary hover:bg-primary/90 font-bold shadow-md">
          <Plus className="w-4 h-4" />
          Add School
        </Button>
      </div>

      {/* Schools List */}
      <div className="grid gap-6">
        {schools.map((school) => {
          const settings = school.settings || {};
          const isDropdownOpen = openDropdownId === school.id;

          return (
            <Card key={school.id} className="shadow-sm hover:shadow-md transition-all border-border relative">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-xl text-primary font-bold">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">{school.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5 rounded border border-slate-200">
                          Code: {school.code}
                        </span>
                        {school.address && (
                          <span className="text-xs text-muted-foreground">• {school.address}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Three Dots Dropdown Menu */}
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setOpenDropdownId(isDropdownOpen ? null : school.id)}
                      className="text-muted-foreground hover:text-foreground rounded-full"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 top-10 z-30 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs text-slate-700 animate-fade-in">
                        <button 
                          onClick={() => copyPortalLink(school.id)} 
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                        >
                          <Copy className="w-3.5 h-3.5 text-blue-600" /> Copy Portal Link
                        </button>
                        <a 
                          href={`/school-portal/${school.id}`} 
                          target="_blank"
                          rel="noreferrer"
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 font-medium border-b"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600" /> Open School Portal
                        </a>
                        <button 
                          onClick={() => handleToggleActive(school.id)} 
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                        >
                          {school.isActive ? "Set Inactive" : "Set Active"}
                        </button>
                        <button 
                          onClick={() => handleDeleteSchool(school.id, school.name)} 
                          className="w-full px-4 py-2.5 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-semibold border-t"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete School
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Status</p>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                      school.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-300"
                    }`}>
                      {school.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Registered Students</p>
                    <p className="text-lg font-black text-slate-900">{school.students?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Active Routes</p>
                    <p className="text-lg font-black text-slate-900">{school.routes?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Max Bus Cap</p>
                    <p className="text-lg font-black text-amber-700">{settings.maxCapacityPerBus || 60} Seats</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Billing Rates</p>
                    <Button 
                      onClick={() => {
                        setSelectedSchool(school);
                        setRateForm({
                          maxCapacityPerBus: settings.maxCapacityPerBus || 60,
                          amRate: Number(settings.amRate) || 150,
                          pmRate: Number(settings.pmRate) || 150,
                          amPmRate: Number(settings.amPmRate) || 250,
                          siblingDiscount: Number(settings.siblingDiscount) || 10,
                        });
                        setIsRateOpen(true);
                      }} 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start gap-1.5 h-8 font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Configure Rates
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {schools.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-card">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">No Schools Found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">Add your first school partner to start managing routes and student registrations.</p>
            <Button onClick={() => setIsAddOpen(true)} className="mt-6 gap-2 font-bold">
              <Plus className="w-4 h-4" />
              Add School
            </Button>
          </div>
        )}
      </div>

      {/* MODAL 1: Add School */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 relative">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Add New School Partner
            </h3>

            <form onSubmit={handleCreateSchool} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">School Name</Label>
                  <Input 
                    value={addForm.name} 
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Lincoln High School" 
                    required 
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">School Registration Code</Label>
                  <Input 
                    value={addForm.code} 
                    onChange={(e) => setAddForm({ ...addForm, code: e.target.value.toUpperCase() })}
                    placeholder="LHS-2026" 
                    required 
                    className="mt-1 text-xs font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Contact Email</Label>
                  <Input 
                    type="email"
                    value={addForm.email} 
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="admin@lincolnhigh.edu" 
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Phone Number</Label>
                  <Input 
                    value={addForm.phone} 
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="(555) 123-4567" 
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Campus Address</Label>
                <Input 
                  value={addForm.address} 
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  placeholder="123 Education Way, Springfield" 
                  className="mt-1 text-xs"
                />
              </div>

              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Default Rate Settings</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">AM Rate ($)</Label>
                    <Input 
                      type="number"
                      value={addForm.amRate} 
                      onChange={(e) => setAddForm({ ...addForm, amRate: Number(e.target.value) })}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">PM Rate ($)</Label>
                    <Input 
                      type="number"
                      value={addForm.pmRate} 
                      onChange={(e) => setAddForm({ ...addForm, pmRate: Number(e.target.value) })}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">AM+PM Rate ($)</Label>
                    <Input 
                      type="number"
                      value={addForm.amPmRate} 
                      onChange={(e) => setAddForm({ ...addForm, amPmRate: Number(e.target.value) })}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Sibling Discount (%)</Label>
                    <Input 
                      type="number"
                      value={addForm.siblingDiscount} 
                      onChange={(e) => setAddForm({ ...addForm, siblingDiscount: Number(e.target.value) })}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Max Bus Capacity</Label>
                    <Input 
                      type="number"
                      value={addForm.maxCapacityPerBus} 
                      onChange={(e) => setAddForm({ ...addForm, maxCapacityPerBus: Number(e.target.value) })}
                      className="mt-1 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs">Cancel</Button>
                <Button type="submit" disabled={loading} className="text-xs font-bold bg-primary">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  Save School
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Configure Rates */}
      {isRateOpen && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <button onClick={() => setIsRateOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-blue-600" /> Configure Rates for {selectedSchool.name}
            </h3>

            <form onSubmit={handleUpdateRates} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">AM Only Rate ($)</Label>
                  <Input 
                    type="number"
                    value={rateForm.amRate}
                    onChange={(e) => setRateForm({ ...rateForm, amRate: Number(e.target.value) })}
                    required 
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">PM Only Rate ($)</Label>
                  <Input 
                    type="number"
                    value={rateForm.pmRate}
                    onChange={(e) => setRateForm({ ...rateForm, pmRate: Number(e.target.value) })}
                    required 
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">AM + PM Both Rate ($)</Label>
                  <Input 
                    type="number"
                    value={rateForm.amPmRate}
                    onChange={(e) => setRateForm({ ...rateForm, amPmRate: Number(e.target.value) })}
                    required 
                    className="mt-1 text-xs font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Sibling Discount (%)</Label>
                  <Input 
                    type="number"
                    value={rateForm.siblingDiscount}
                    onChange={(e) => setRateForm({ ...rateForm, siblingDiscount: Number(e.target.value) })}
                    required 
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Max Bus Capacity Limit</Label>
                <Input 
                  type="number"
                  value={rateForm.maxCapacityPerBus}
                  onChange={(e) => setRateForm({ ...rateForm, maxCapacityPerBus: Number(e.target.value) })}
                  required 
                  className="mt-1 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsRateOpen(false)} className="text-xs">Cancel</Button>
                <Button type="submit" disabled={loading} className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  Update Rates
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
