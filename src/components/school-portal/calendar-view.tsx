"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Bus, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripItem {
  id: string;
  organizationName: string;
  tripDate: string | Date;
  pickupAddress: string;
  destinationAddress: string;
  numberOfBuses: number;
  numberOfStudents: number;
  status: string;
  calendarEventId?: string | null;
}

interface CalendarViewProps {
  trips: TripItem[];
}

export default function SchoolCalendarView({ trips = [] }: CalendarViewProps) {
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Transportation Schedule & Calendar
          </CardTitle>
          <CardDescription>Upcoming field trips and scheduled bus runs synced with Google Calendar</CardDescription>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
          <CheckCircle className="h-3.5 w-3.5 text-blue-600" /> Google Calendar Synced
        </div>
      </CardHeader>

      <CardContent>
        {trips.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed rounded-lg border-slate-200">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No scheduled trips found</p>
            <p className="text-xs text-slate-400 mt-1">Submit a new field trip request above to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <div 
                key={trip.id} 
                className="p-4 border rounded-xl bg-slate-50 hover:bg-white transition-all shadow-sm border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{trip.organizationName}</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      trip.status === "APPROVED" || trip.status === "SCHEDULED" ? "bg-emerald-100 text-emerald-800" :
                      trip.status === "QUOTED" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-amber-600" />
                      {new Date(trip.tripDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      {trip.destinationAddress}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Bus className="h-3.5 w-3.5 text-blue-600" />
                      {trip.numberOfBuses} Bus{trip.numberOfBuses > 1 ? "es" : ""} ({trip.numberOfStudents} Students)
                    </span>
                  </div>
                </div>

                {trip.calendarEventId && (
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <a
                      href={`/api/calendar/embed`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center h-8 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors gap-1 shadow-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-blue-600" /> View in Google Calendar
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
