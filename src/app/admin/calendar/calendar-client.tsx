"use client"

import { useState } from "react"
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Bus, Clock, MapPin, Users, UserCheck, Filter, X
} from "lucide-react"

interface OperationsCalendarClientProps {
  charterTrips: any[]
  routes: any[]
}

export default function OperationsCalendarClient({
  charterTrips,
  routes,
}: OperationsCalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterType, setFilterType] = useState<"ALL" | "CHARTER" | "AM_RUN" | "PM_RUN">("ALL")
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // Navigation helpers
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const today = () => {
    setCurrentDate(new Date())
  }

  // Days in month calculation
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Generate calendar day cells
  const calendarCells: Array<{ dayNumber: number | null; dateStr: string | null }> = []

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ dayNumber: null, dateStr: null })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const yyyy = year
    const mm = String(month + 1).padStart(2, "0")
    const dd = String(day).padStart(2, "0")
    const dateStr = `${yyyy}-${mm}-${dd}`
    calendarCells.push({ dayNumber: day, dateStr })
  }

  // Map events to date strings
  const getEventsForDate = (dateStr: string | null) => {
    if (!dateStr) return []

    const events: any[] = []

    // 1. Add Charter Trips matching this date
    charterTrips.forEach((trip) => {
      const tripD = new Date(trip.tripDate)
      const tripYyyy = tripD.getUTCFullYear()
      const tripMm = String(tripD.getUTCMonth() + 1).padStart(2, "0")
      const tripDd = String(tripD.getUTCDate()).padStart(2, "0")
      const tripDateStr = `${tripYyyy}-${tripMm}-${tripDd}`
      
      const localYyyy = tripD.getFullYear()
      const localMm = String(tripD.getMonth() + 1).padStart(2, "0")
      const localDd = String(tripD.getDate()).padStart(2, "0")
      const localDateStr = `${localYyyy}-${localMm}-${localDd}`

      if (tripDateStr === dateStr || localDateStr === dateStr) {
        if (filterType === "ALL" || filterType === "CHARTER") {
          events.push({
            id: `charter-${trip.id}`,
            type: "CHARTER",
            title: `Charter: ${trip.organizationName}`,
            status: trip.status,
            time: new Date(trip.tripDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            driver: trip.assignments[0]?.driver ? `${trip.assignments[0].driver.firstName} ${trip.assignments[0].driver.lastName}` : "Unassigned",
            bus: trip.assignments[0]?.bus?.busNumber || "TBD",
            raw: trip,
          })
        }
      }
    })

    // 2. Add Recurring AM / PM Runs for weekdays (Mon-Fri)
    const dayOfWeek = new Date(dateStr).getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      routes.forEach((route) => {
        route.runs.forEach((run: any) => {
          if (run.type === "AM" && (filterType === "ALL" || filterType === "AM_RUN")) {
            events.push({
              id: `run-am-${route.id}-${run.id}`,
              type: "AM_RUN",
              title: `AM: ${route.name}`,
              status: "ACTIVE",
              time: "7:00 AM",
              driver: run.driverAssignment?.driver ? `${run.driverAssignment.driver.firstName} ${run.driverAssignment.driver.lastName}` : "Assigned Driver",
              bus: run.driverAssignment?.bus?.busNumber || "101",
              raw: { route, run },
            })
          }
          if (run.type === "PM" && (filterType === "ALL" || filterType === "PM_RUN")) {
            events.push({
              id: `run-pm-${route.id}-${run.id}`,
              type: "PM_RUN",
              title: `PM: ${route.name}`,
              status: "ACTIVE",
              time: "3:15 PM",
              driver: run.driverAssignment?.driver ? `${run.driverAssignment.driver.firstName} ${run.driverAssignment.driver.lastName}` : "Assigned Driver",
              bus: run.driverAssignment?.bus?.busNumber || "101",
              raw: { route, run },
            })
          }
        })
      })
    }

    return events
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-primary" /> Operations Dispatch Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual month schedule of active charter field trips, recurring school bus runs, and driver assignments.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterType === "ALL" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterType("CHARTER")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterType === "CHARTER" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Charter Trips
            </button>
            <button
              onClick={() => setFilterType("AM_RUN")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterType === "AM_RUN" ? "bg-amber-600 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              AM Runs
            </button>
            <button
              onClick={() => setFilterType("PM_RUN")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterType === "PM_RUN" ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              PM Runs
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Header Controls */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold font-heading text-foreground">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={today}
            className="px-3 py-1 border border-input rounded-lg text-xs font-semibold hover:bg-muted transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 border border-input rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 border border-input rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 bg-muted/50 border-b border-border text-center text-xs font-bold text-muted-foreground uppercase py-3">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border bg-background">
          {calendarCells.map((cell, idx) => {
            const events = getEventsForDate(cell.dateStr)
            const isToday = cell.dateStr === new Date().toISOString().split("T")[0]

            return (
              <div
                key={idx}
                className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                  !cell.dayNumber ? "bg-muted/10" : isToday ? "bg-primary/5 font-semibold" : "hover:bg-muted/10"
                }`}
              >
                {cell.dayNumber ? (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center ${
                        isToday ? "bg-primary text-primary-foreground font-bold" : "text-foreground"
                      }`}>
                        {cell.dayNumber}
                      </span>
                      {events.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {events.length} event(s)
                        </span>
                      )}
                    </div>

                    {/* Events List inside Day Cell */}
                    <div className="space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                      {events.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left p-1.5 rounded text-[11px] font-medium truncate block transition-all shadow-xs ${
                            ev.type === "CHARTER" ? "bg-blue-600 text-white hover:bg-blue-700" :
                            ev.type === "AM_RUN" ? "bg-amber-500 text-white hover:bg-amber-600" :
                            "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          <div className="truncate font-semibold">{ev.title}</div>
                          <div className="text-[10px] opacity-90 truncate">
                            {ev.time} • Bus #{ev.bus}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className={`p-3 rounded-xl text-white ${
                selectedEvent.type === "CHARTER" ? "bg-blue-600" :
                selectedEvent.type === "AM_RUN" ? "bg-amber-500" : "bg-indigo-600"
              }`}>
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-foreground">
                  {selectedEvent.title}
                </h3>
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {selectedEvent.type} • {selectedEvent.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold">Time:</span> {selectedEvent.time}
              </div>

              <div className="flex items-center gap-2 text-foreground">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Driver:</span> {selectedEvent.driver}
              </div>

              <div className="flex items-center gap-2 text-foreground">
                <Bus className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold">Bus Unit:</span> Bus #{selectedEvent.bus}
              </div>

              {selectedEvent.type === "CHARTER" && (
                <>
                  <div className="flex items-start gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Pickup Address:</span> {selectedEvent.raw.pickupAddress}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Destination:</span> {selectedEvent.raw.destinationName} ({selectedEvent.raw.destinationAddress})
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold">Passengers:</span> {selectedEvent.raw.numberOfStudents} students ({selectedEvent.raw.numberOfBuses} buses)
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
