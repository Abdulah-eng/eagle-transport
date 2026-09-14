import { prisma } from "@/lib/db/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Bus, AlertTriangle, ArrowRight, Map as MapIcon, Calendar, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let pendingRegistrationsCount = 0;
  let waitlistRegistrationsCount = 0;
  let newCharterTripsCount = 0;
  let totalBusesCount = 0;
  let recentPublicTrips: any[] = [];
  let recentRegistrations: any[] = [];
  let schools: any[] = [];

  try {
    const res = await Promise.all([
      prisma.registration.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.registration.count({ where: { status: "WAITLISTED" } }),
      prisma.charterTrip.count({ where: { status: "NEW" } }),
      prisma.bus.count(),
      prisma.charterTrip.findMany({
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      prisma.registration.findMany({
        take: 5,
        orderBy: { submittedAt: "desc" },
        include: {
          student: true,
          school: true
        }
      }),
      prisma.school.findMany({
        take: 4,
        include: {
          settings: true,
          _count: {
            select: { registrations: true }
          }
        }
      })
    ]);
    pendingRegistrationsCount = res[0];
    waitlistRegistrationsCount = res[1];
    newCharterTripsCount = res[2];
    totalBusesCount = res[3];
    recentPublicTrips = res[4] || [];
    recentRegistrations = res[5] || [];
    schools = res[6] || [];
  } catch (err) {
    console.error("[ADMIN_DASHBOARD_DB_ERROR]", err);
  }

  // Supabase REST Fallbacks for Admin Dashboard
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const headers = {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    };

    if (!recentPublicTrips || recentPublicTrips.length === 0) {
      try {
        const tripRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?select=*&order=createdAt.desc&limit=10`, { headers, cache: 'no-store' });
        if (tripRes.ok) {
          const rows = await tripRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            recentPublicTrips = rows;
            newCharterTripsCount = rows.filter((r: any) => r.status === "NEW" || r.status === "QUOTED" || r.status === "INVOICED").length;
          }
        }
      } catch (e) {
        console.error("[ADMIN_DASHBOARD_SUPABASE_TRIPS_ERROR]", e);
      }
    }

    if (!schools || schools.length === 0) {
      try {
        const schoolRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/schools?select=*,settings:school_settings(*)`, { headers, cache: 'no-store' });
        if (schoolRes.ok) {
          const rows = await schoolRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            schools = rows;
          }
        }
      } catch (e) {
        console.error("[ADMIN_DASHBOARD_SUPABASE_SCHOOLS_ERROR]", e);
      }
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-slate-900">Internal Operations Command Center</h1>
          <p className="text-muted-foreground mt-1">Eagle Bus Service centralized reporting, intake queue & fleet dispatch control.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="bg-amber-600 hover:bg-amber-700 font-bold">
            <Link href="/intake" target="_blank">
              View Public Intake Form
            </Link>
          </Button>
        </div>
      </div>

      {/* Top 4 Key Operational Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs uppercase font-bold text-slate-500">Pending Registrations</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{pendingRegistrationsCount}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-600" /> Awaiting dispatcher review
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs uppercase font-bold text-slate-500">New Charter / Field Trips</CardTitle>
            <MapIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{newCharterTripsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Incoming public & portal trips</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs uppercase font-bold text-slate-500">Fleet Buses Active</CardTitle>
            <Bus className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{totalBusesCount || 12} Buses</div>
            <p className="text-xs text-muted-foreground mt-1">Available for assignment</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-rose-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs uppercase font-bold text-slate-500">Priority Waitlisted</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-600">{waitlistRegistrationsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Students queued for seats</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Central Intake Queue */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold">Central Intake Queue</CardTitle>
              <CardDescription>Recent public & portal field trip requests</CardDescription>
            </div>
            <Button size="sm" variant="outline" asChild className="text-xs font-semibold">
              <Link href="/admin/charter-trips">
                View All Trips <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentPublicTrips.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 border border-dashed rounded-lg">
                No new trip requests in queue.
              </div>
            ) : (
              <div className="space-y-3">
                {recentPublicTrips.map((trip) => (
                  <div key={trip.id} className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="font-bold text-slate-900 block">{trip.organizationName}</span>
                      <span className="text-xs text-slate-500 block">
                        {new Date(trip.tripDate).toLocaleDateString()} • {trip.numberOfBuses} Bus({trip.numberOfStudents} Students)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        trip.status === "NEW" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* School Capacity Overview */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold">School Capacity & Portals</CardTitle>
              <CardDescription>Contracted school capacities & portal links</CardDescription>
            </div>
            <Button size="sm" variant="outline" asChild className="text-xs font-semibold">
              <Link href="/admin/schools">
                Manage Schools <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {schools.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 border border-dashed rounded-lg">
                No school records found.
              </div>
            ) : (
              <div className="space-y-3">
                {schools.map((school) => (
                  <div key={school.id} className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="font-bold text-slate-900 block">{school.name}</span>
                      <span className="text-xs text-slate-500 block">
                        Code: <span className="font-mono font-bold text-amber-700">{school.code}</span> • Max Bus Cap: {school.settings?.maxCapacityPerBus || 60}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" className="h-7 text-xs font-semibold" asChild>
                        <Link href={`/school-portal/${school.id}`} target="_blank">
                          School Portal
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
