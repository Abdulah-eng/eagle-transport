"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Map, Upload, Download, Route as RouteIcon, Search, 
  Plus, CheckCircle2, AlertCircle, Loader2, X 
} from "lucide-react";

interface RoutesClientProps {
  routes: any[];
  schools: any[];
  students: any[];
}

export default function RoutesClient({ routes: initialRoutes, schools, students }: RoutesClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [routes, setRoutes] = useState(initialRoutes);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Add Route Form
  const [addForm, setAddForm] = useState({
    name: "",
    schoolId: "",
    description: "",
    amRun: true,
    pmRun: true,
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const filteredRoutes = initialRoutes.filter((r) => {
    const searchLower = search.toLowerCase();
    const routeName = (r.name || "").toLowerCase();
    const schoolName = (r.school?.name || "").toLowerCase();
    return routeName.includes(searchLower) || schoolName.includes(searchLower);
  });

  // Export StudentUploads.csv for Traversa Ingestion
  const exportTraversaCSV = () => {
    const headers = ["Student_ID", "First_Name", "Last_Name", "Grade", "School_Code", "School_Name", "Address", "Service_Type"];
    const rows = students.map(s => [
      s.id,
      `"${s.firstName}"`,
      `"${s.lastName}"`,
      `"${s.grade || ''}"`,
      `"${s.school?.code || ''}"`,
      `"${s.school?.name || ''}"`,
      `"${s.parent?.address || s.parent?.city || ''}"`,
      "AM_PM"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `StudentUploads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("success", "StudentUploads.csv generated for Traversa ingestion!");
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create route");

      showToast("success", "Route created successfully!");
      setIsAddOpen(false);
      setAddForm({ name: "", schoolId: "", description: "", amRun: true, pmRun: true });
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadTraversaCSV = async () => {
    if (!uploadFile) return;
    setLoading(true);
    try {
      const text = await uploadFile.text();
      const res = await fetch("/api/admin/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload_traversa",
          csvContent: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Traversa upload failed");

      showToast("success", data.message || "Traversa routing data imported successfully!");
      setIsUploadOpen(false);
      setUploadFile(null);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold font-heading">Routes & Routing</h1>
          <p className="text-muted-foreground mt-1">Manage AM/PM routes, stops, and Traversa routing sync.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="shrink-0 gap-2 font-bold bg-primary shadow-md">
          <Plus className="w-4 h-4" /> Add Route
        </Button>
      </div>

      {/* Traversa Import/Export Action Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 font-bold">
              <Download className="w-5 h-5 text-primary" />
              Export to Traversa
            </CardTitle>
            <CardDescription className="text-xs">
              Generate a CSV of all active and newly registered students formatted for Traversa routing ingestion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportTraversaCSV} className="w-full gap-2 font-bold bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4" />
              Download StudentUploads.csv
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-emerald-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 font-bold">
              <Upload className="w-5 h-5 text-emerald-600" />
              Import from Traversa
            </CardTitle>
            <CardDescription className="text-xs">
              Upload completed routing assignments from Traversa to update student bus, route, and stop information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setIsUploadOpen(true)} 
              variant="outline" 
              className="w-full gap-2 border-dashed border-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold"
            >
              <Upload className="w-4 h-4" />
              Upload Traversa Routing Data (.csv)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Routes List Card */}
      <Card className="shadow-sm mt-8">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search routes by name or school..." 
              className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background text-xs"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Route ID / Name</th>
                <th className="px-6 py-4 font-medium">School</th>
                <th className="px-6 py-4 font-medium">Runs</th>
                <th className="px-6 py-4 font-medium">Total Stops</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRoutes.map((route) => {
                const totalStops = route.runs?.reduce((acc: number, run: any) => acc + (run.stops?.length || 0), 0) || 0;

                return (
                  <tr key={route.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-primary" />
                        {route.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-semibold">
                      {route.school?.name || "Unassigned School"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex gap-1">
                        {route.runs?.map((r: any) => (
                          <span key={r.id} className="bg-slate-100 text-slate-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded border">
                            {r.type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-bold">
                      {totalStops} Stops
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredRoutes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <RouteIcon className="w-10 h-10 text-muted-foreground opacity-20 mb-3" />
                      <p className="font-semibold text-sm">No routes found.</p>
                      <p className="text-xs mt-1">Click "+ Add Route" or "Upload Traversa" to import routes.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL 1: Add Route */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-primary" /> Create New Route
            </h3>

            <form onSubmit={handleCreateRoute} className="space-y-4 text-left">
              <div>
                <Label className="text-xs font-semibold">Route Name / ID</Label>
                <Input 
                  value={addForm.name} 
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="R-101 North Express" 
                  required 
                  className="mt-1 text-xs font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Assigned School</Label>
                <select 
                  value={addForm.schoolId}
                  onChange={(e) => setAddForm({ ...addForm, schoolId: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg bg-white text-xs"
                >
                  <option value="">-- Unassigned --</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Route Description</Label>
                <Textarea 
                  value={addForm.description} 
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Main morning pickup covering North District stops..." 
                  rows={2}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs">Cancel</Button>
                <Button type="submit" disabled={loading} className="text-xs font-bold bg-primary">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  Create Route
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload Traversa */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <button onClick={() => setIsUploadOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" /> Import Traversa Routing Data
            </h3>
            <p className="text-xs text-slate-500">Select your Traversa exported CSV file to import routes and stops into Eagle Bus.</p>

            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl p-8 text-center cursor-pointer transition-all"
              >
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {uploadFile ? uploadFile.name : "Click to select Traversa CSV file"}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Supports .csv format</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv" 
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)} className="text-xs">Cancel</Button>
                <Button 
                  disabled={!uploadFile || loading} 
                  onClick={handleUploadTraversaCSV}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  Import Traversa CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
