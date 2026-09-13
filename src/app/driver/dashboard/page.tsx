"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, User, CheckCircle2, Clock, AlertTriangle } from "lucide-react"

// Mock Data for the driver's current run
const currentRun = {
  id: "run_101",
  type: "AM",
  route: "R-101 North",
  status: "IN_PROGRESS",
  stops: [
    {
      id: "stop_1",
      location: "Main St & 4th Ave",
      time: "07:15 AM",
      students: [
        { id: "s1", name: "Alice Johnson", grade: "5th", status: "PENDING" },
        { id: "s2", name: "Bobby Smith", grade: "3rd", status: "PENDING" },
      ]
    },
    {
      id: "stop_2",
      location: "Oak St & Elm Dr",
      time: "07:25 AM",
      students: [
        { id: "s3", name: "Charlie Davis", grade: "6th", status: "PENDING" },
      ]
    }
  ]
}

export default function DriverManifestPage() {
  const [stops, setStops] = useState(currentRun.stops)

  const toggleStudentStatus = (stopId: string, studentId: string) => {
    setStops(currentStops => 
      currentStops.map(stop => {
        if (stop.id !== stopId) return stop;
        return {
          ...stop,
          students: stop.students.map(s => {
            if (s.id !== studentId) return s;
            return {
              ...s,
              status: s.status === "PENDING" ? "BOARDED" : s.status === "BOARDED" ? "ABSENT" : "PENDING"
            }
          })
        }
      })
    )
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="bg-primary text-primary-foreground p-4 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80 mb-1">Current Run</p>
            <h1 className="text-2xl font-bold font-heading">{currentRun.route} ({currentRun.type})</h1>
          </div>
          <div className="bg-primary-foreground/20 px-3 py-1 rounded-full text-xs font-bold border border-primary-foreground/30">
            In Progress
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {stops.map((stop, index) => (
          <Card key={stop.id} className="shadow-sm border-t-4 border-t-secondary overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b">
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-start">
                  <div className="bg-secondary text-secondary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base leading-tight">{stop.location}</CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                      <Clock className="w-3 h-3" /> Scheduled: {stop.time}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {stop.students.map(student => (
                  <div key={student.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-full text-muted-foreground">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">Grade {student.grade}</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant={student.status === "PENDING" ? "outline" : student.status === "BOARDED" ? "default" : "destructive"}
                      className={`w-28 font-bold text-xs uppercase tracking-wider transition-all ${
                        student.status === "BOARDED" ? "bg-green-600 hover:bg-green-700" : ""
                      }`}
                      onClick={() => toggleStudentStatus(stop.id, student.id)}
                    >
                      {student.status === "PENDING" ? "Tap to Board" : student.status === "BOARDED" ? "Boarded" : "Absent"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="pt-4 pb-8">
          <Button variant="destructive" className="w-full gap-2" size="lg">
            <AlertTriangle className="w-5 h-5" />
            Report Incident / Issue
          </Button>
        </div>
      </div>
    </div>
  )
}
