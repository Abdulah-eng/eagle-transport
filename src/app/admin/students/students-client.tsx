"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, GraduationCap, Filter, Download, X } from "lucide-react";

interface StudentsClientProps {
  students: any[];
  schools: any[];
}

export default function StudentsClient({ students: initialStudents, schools }: StudentsClientProps) {
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("ALL");
  const [selectedGrade, setSelectedGrade] = useState("ALL");

  const filteredStudents = initialStudents.filter((student) => {
    const searchLower = search.toLowerCase();
    const studentName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const schoolName = (student.school?.name || "").toLowerCase();
    const parentName = (student.parent?.user?.name || `${student.parent?.firstName || ''} ${student.parent?.lastName || ''}`).toLowerCase();
    const parentEmail = (student.parent?.user?.email || student.parent?.email || "").toLowerCase();

    const matchesSearch = studentName.includes(searchLower) || schoolName.includes(searchLower) || parentName.includes(searchLower) || parentEmail.includes(searchLower);
    const matchesSchool = selectedSchool === "ALL" || student.schoolId === selectedSchool;
    const matchesGrade = selectedGrade === "ALL" || (student.grade && student.grade.toString() === selectedGrade);

    return matchesSearch && matchesSchool && matchesGrade;
  });

  const exportCSV = () => {
    const headers = ["Student ID", "First Name", "Last Name", "Grade", "School Name", "School Code", "Parent Name", "Parent Email", "Parent Phone", "Status"];
    const rows = filteredStudents.map(s => [
      s.id,
      `"${s.firstName}"`,
      `"${s.lastName}"`,
      `"${s.grade || ''}"`,
      `"${s.school?.name || ''}"`,
      `"${s.school?.code || ''}"`,
      `"${s.parent?.user?.name || s.parent?.firstName || ''}"`,
      `"${s.parent?.user?.email || s.parent?.email || ''}"`,
      `"${s.parent?.phone1 || ''}"`,
      s.isActive ? "Active" : "Inactive"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `students_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Students Overview</h1>
          <p className="text-muted-foreground mt-1">Manage student records, routing assignments, and parent contact information.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowFilter(!showFilter)} 
            variant={showFilter ? "default" : "outline"} 
            className="shrink-0 gap-2 font-semibold"
          >
            <Filter className="w-4 h-4" />
            Filter {showFilter ? "ON" : ""}
          </Button>
          <Button onClick={exportCSV} variant="outline" className="shrink-0 gap-2 font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilter && (
        <Card className="p-4 bg-slate-50 border border-slate-200 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Filter by School:</label>
                <select 
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="p-2 border rounded-lg bg-white text-xs"
                >
                  <option value="ALL">All Schools ({schools.length})</option>
                  {schools.map(sch => (
                    <option key={sch.id} value={sch.id}>{sch.name} ({sch.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Filter by Grade:</label>
                <select 
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="p-2 border rounded-lg bg-white text-xs"
                >
                  <option value="ALL">All Grades</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setSelectedSchool("ALL"); setSelectedGrade("ALL"); setSearch(""); }}
              className="text-xs text-rose-600 font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Main Student List Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, school, parent, or email..." 
              className="pl-9 max-w-md bg-muted/50 border-transparent focus-visible:bg-background text-xs"
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Student Name</th>
                <th className="px-6 py-4 font-medium">School</th>
                <th className="px-6 py-4 font-medium">Grade</th>
                <th className="px-6 py-4 font-medium">Parent / Guardian</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-semibold">
                    {student.school?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <span className="bg-slate-100 text-slate-800 font-mono text-xs px-2 py-0.5 rounded border">
                      Grade {student.grade || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-900">
                      {student.parent?.user?.name || `${student.parent?.firstName || ''} ${student.parent?.lastName || ''}` || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {student.parent?.user?.email || student.parent?.email || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No students match your search or filter criteria.
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
