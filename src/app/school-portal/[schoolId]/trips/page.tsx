import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Map, Calendar, Users, Clock, ExternalLink, Bus } from "lucide-react"

export default async function SchoolTripsPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const resolvedParams = await params;
  // Mock data for trips
  const trips = [
    { 
      id: "trip_1", 
      organization: "Band Competition", 
      date: new Date(Date.now() + 86400000 * 1), 
      status: "APPROVED", 
      destination: "State University Stadium",
      students: 120,
      buses: 3,
      pickupTime: "07:00 AM"
    },
    { 
      id: "trip_2", 
      organization: "Science Center Visit", 
      date: new Date(Date.now() + 86400000 * 14), 
      status: "PENDING_QUOTE", 
      destination: "Downtown Science Museum",
      students: 45,
      buses: 1,
      pickupTime: "09:00 AM"
    },
    { 
      id: "trip_3", 
      organization: "History Museum", 
      date: new Date(Date.now() - 86400000 * 30), 
      status: "COMPLETED", 
      destination: "National History Museum",
      students: 85,
      buses: 2,
      pickupTime: "08:30 AM"
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Field Trips</h1>
          <p className="text-muted-foreground mt-2">Manage and review your charter and field trip requests.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Map className="w-4 h-4" />
          Request New Trip
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {trips.map((trip) => (
          <Card key={trip.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold leading-tight line-clamp-2">
                  {trip.organization}
                </CardTitle>
                <div className="ml-4 shrink-0">
                  {trip.status === 'APPROVED' ? (
                    <span className="text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-md text-xs font-semibold">Approved</span>
                  ) : trip.status === 'PENDING_QUOTE' ? (
                    <span className="text-secondary-foreground bg-secondary/20 border border-secondary/30 px-2 py-1 rounded-md text-xs font-semibold">Pending Quote</span>
                  ) : (
                    <span className="text-muted-foreground bg-muted border border-border px-2 py-1 rounded-md text-xs font-semibold">Completed</span>
                  )}
                </div>
              </div>
              <CardDescription className="flex items-center gap-1.5 mt-2 text-primary font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {trip.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2 text-sm">
                  <Map className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-foreground line-clamp-2">{trip.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">Pickup: {trip.pickupTime}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {trip.students} Passengers
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bus className="w-4 h-4" />
                    {trip.buses} {trip.buses === 1 ? 'Bus' : 'Buses'}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border mt-auto">
                <Button variant="ghost" className="w-full justify-between hover:bg-primary/5 hover:text-primary">
                  View Details
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
