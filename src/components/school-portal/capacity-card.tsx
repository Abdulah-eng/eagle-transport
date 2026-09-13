"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, Clock, AlertTriangle, Bus } from "lucide-react";

interface CapacityCardProps {
  schoolName: string;
  maxCapacity: number;
  registeredCount: number;
  waitlistedCount: number;
  busCount: number;
}

export default function SchoolCapacityCard({
  schoolName,
  maxCapacity = 60,
  registeredCount = 0,
  waitlistedCount = 0,
  busCount = 1,
}: CapacityCardProps) {
  const totalCapacity = maxCapacity * busCount;
  const utilizationPercentage = Math.min(100, Math.round((registeredCount / (totalCapacity || 1)) * 100));
  const isFull = registeredCount >= totalCapacity;

  return (
    <Card className="border-t-4 border-t-amber-500 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Bus Capacity & Enrollment</CardTitle>
            <CardDescription>{schoolName} Transportation Status</CardDescription>
          </div>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
            isFull ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }`}>
            {isFull ? <AlertTriangle className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
            {isFull ? "Waitlist Active" : "Capacity Available"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1 font-medium">
            <span className="text-muted-foreground">Overall Seat Utilization</span>
            <span className="font-bold text-slate-800">{utilizationPercentage}% ({registeredCount} / {totalCapacity} seats)</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <div 
              className={`h-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
              <Bus className="h-3.5 w-3.5 text-blue-600" /> Buses Deployed
            </div>
            <span className="text-xl font-bold text-slate-900">{busCount}</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-medium mb-1">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> Registered
            </div>
            <span className="text-xl font-bold text-emerald-900">{registeredCount}</span>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 font-medium mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-600" /> Waitlisted
            </div>
            <span className="text-xl font-bold text-amber-900">{waitlistedCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
