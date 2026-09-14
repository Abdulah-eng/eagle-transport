import { prisma } from "@/lib/db/client";
import SchoolCapacityCard from "@/components/school-portal/capacity-card";
import SchoolCalendarView from "@/components/school-portal/calendar-view";
import NewTripModalButton from "@/components/school-portal/new-trip-modal-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bus, Receipt, Users, Clock, PlusCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SchoolDashboardPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const resolvedParams = await params;
  const schoolIdParam = resolvedParams?.schoolId || "";

  // Fetch School by ID or code fallback
  let school: any = null;
  try {
    if (schoolIdParam) {
      school = await prisma.school.findFirst({
        where: {
          OR: [
            { id: schoolIdParam },
            { code: schoolIdParam.toUpperCase() }
          ]
        },
        include: {
          settings: true,
          contacts: true,
          routes: {
            include: { runs: true }
          }
        }
      });
    }

    if (!school) {
      school = await prisma.school.findFirst({
        include: {
          settings: true,
          contacts: true,
          routes: {
            include: { runs: true }
          }
        }
      });
    }
  } catch (err) {
    console.error("[SCHOOL_DASHBOARD_SCHOOL_ERROR]", err);
  }

  if (!school && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/schools?select=*,settings:school_settings(*),contacts:school_contacts(*),routes(*)`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        cache: 'no-store'
      })
      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows) && rows.length > 0) {
          school = rows.find((s: any) => 
            s.id === schoolIdParam || 
            s.id.includes(schoolIdParam) || 
            s.code === schoolIdParam.toUpperCase()
          ) || rows[0]
        }
      }
    } catch (e) {
      console.error("[SCHOOL_DASHBOARD_SUPABASE_FALLBACK_ERROR]", e)
    }
  }

  if (!school) {
    school = {
      id: schoolIdParam || "sch_lincoln_001",
      name: "Lincoln High School",
      code: "LHS101",
      address: "1200 Lincoln Ave, Springfield, IL",
      settings: { maxCapacityPerBus: 60 },
      contacts: [{ name: "Dr. Robert Vance", email: "principal@lincoln.edu" }],
      routes: [{ id: "r1", name: "Lincoln Route 101" }, { id: "r2", name: "Lincoln Route 104" }]
    }
  }

  const activeSchoolId = school?.id || schoolIdParam || "sch_lincoln_001";

  // Fetch Reporting Metrics
  let registeredCount = 0;
  let waitlistedCount = 0;
  let pendingCount = 0;
  let invoices: any[] = [];
  let recentTrips: any[] = [];

  try {
    const res = await Promise.all([
      prisma.registration.count({
        where: { schoolId: activeSchoolId, status: "APPROVED" }
      }),
      prisma.registration.count({
        where: { schoolId: activeSchoolId, status: "WAITLISTED" }
      }),
      prisma.registration.count({
        where: { schoolId: activeSchoolId, status: "PENDING_REVIEW" }
      }),
      prisma.invoice.findMany({
        where: {
          OR: [
            { schoolId: activeSchoolId },
            { schoolId: schoolIdParam },
            { charterTrip: { schoolId: activeSchoolId } },
            { charterTrip: { schoolId: schoolIdParam } }
          ]
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.charterTrip.findMany({
        where: {
          OR: [
            { schoolId: activeSchoolId },
            { schoolId: schoolIdParam }
          ]
        },
        orderBy: { tripDate: "asc" },
        take: 5
      })
    ]);
    registeredCount = res[0];
    waitlistedCount = res[1];
    pendingCount = res[2];
    invoices = res[3] || [];
    recentTrips = res[4] || [];
  } catch (err) {
    console.error("[SCHOOL_DASHBOARD_METRICS_ERROR]", err);
  }

  // Supabase REST Fallback for Invoices & Charter Trips if Prisma returned empty or failed
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (!invoices || invoices.length === 0) {
      try {
        const invRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/invoices?select=*,charterTrip:charter_trips(*)`, {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          cache: 'no-store'
        });
        if (invRes.ok) {
          const rows = await invRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            invoices = rows.filter((inv: any) => {
              const tripSchool = inv.charterTrip?.schoolId;
              const bName = (inv.billingName || "").toLowerCase();
              const sName = (school?.name || "").toLowerCase();
              const sCode = (school?.code || "").toLowerCase();
              return (
                (inv.schoolId && (inv.schoolId === activeSchoolId || inv.schoolId === schoolIdParam)) ||
                (tripSchool && (tripSchool === activeSchoolId || tripSchool === schoolIdParam)) ||
                (sName && sName.length > 3 && bName.includes(sName)) ||
                (sCode && sCode.length > 2 && bName.includes(sCode))
              );
            });
          }
        }
      } catch (e) {
        console.error("[SCHOOL_DASHBOARD_SUPABASE_INVOICES_ERROR]", e);
      }
    }

    if (!recentTrips || recentTrips.length === 0) {
      try {
        const tripRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?select=*`, {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          cache: 'no-store'
        });
        if (tripRes.ok) {
          const rows = await tripRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            recentTrips = rows.filter((t: any) => {
              const oName = (t.organizationName || "").toLowerCase();
              const sName = (school?.name || "").toLowerCase();
              const sCode = (school?.code || "").toLowerCase();
              return (
                (t.schoolId && (t.schoolId === activeSchoolId || t.schoolId === schoolIdParam)) ||
                (sName && sName.length > 3 && oName.includes(sName)) ||
                (sCode && sCode.length > 2 && oName.includes(sCode))
              );
            });
          }
        }
      } catch (e) {
        console.error("[SCHOOL_DASHBOARD_SUPABASE_TRIPS_ERROR]", e);
      }
    }
  }

  const unpaidInvoices = invoices.filter(inv => inv.status !== "PAID");
  const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0);
  const busCount = school?.routes?.length || 2;
  const maxCapacityPerBus = school?.settings?.maxCapacityPerBus || 60;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header section with Action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <span className="text-xs uppercase tracking-wider text-amber-200 font-semibold">School Transportation Portal</span>
          <h1 className="text-3xl font-extrabold font-heading mt-0.5">{school?.name || "Eagle School Partner"}</h1>
          <p className="text-amber-100 text-sm mt-1">School Code: <span className="font-mono bg-amber-900/40 px-2 py-0.5 rounded text-amber-200 font-bold">{school?.code || "EAGLE"}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <NewTripModalButton schoolId={activeSchoolId} schoolName={school?.name || "School"} />
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-amber-500 shadow-md hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-500">Active Registrations</CardTitle>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{registeredCount}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Confirmed active riders
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-600 shadow-md hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-500">Priority Waitlist</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">{waitlistedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {waitlistedCount > 0 ? `${waitlistedCount} students awaiting seats` : "No waitlist queue"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-rose-500 shadow-md hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-500">Unpaid Balance (QB)</CardTitle>
            <Receipt className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">${totalUnpaidAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {unpaidInvoices.length} invoice{unpaidInvoices.length === 1 ? "" : "s"} pending payment
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500 shadow-md hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-500">Buses Allocated</CardTitle>
            <Bus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{busCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Max capacity: {maxCapacityPerBus * busCount} students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Capacity Card & QuickBooks Invoices Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SchoolCapacityCard 
          schoolName={school?.name || "School"}
          maxCapacity={maxCapacityPerBus}
          registeredCount={registeredCount}
          waitlistedCount={waitlistedCount}
          busCount={busCount}
        />

        {/* Financial Visibility Card */}
        <Card className="border-t-4 border-t-emerald-500 shadow-md">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">QuickBooks Financial Summary</CardTitle>
              <CardDescription>Billing status and recent invoice statements</CardDescription>
            </div>
            <Link 
              href={`/school-portal/${activeSchoolId}/invoices`}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 underline"
            >
              View All Invoices
            </Link>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500 border border-dashed rounded-lg">
                No billing statements generated yet.
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 3).map((inv) => (
                  <Link 
                    key={inv.id} 
                    href={`/school-portal/${activeSchoolId}/invoices?invoiceId=${inv.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg border text-sm group cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block">{inv.invoiceNumber}</span>
                      <span className="text-xs text-slate-500">
                        {inv.dueDate ? `Due ${new Date(inv.dueDate).toLocaleDateString()}` : "Due upon receipt"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">${Number(inv.totalAmount || inv.amount).toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        inv.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Google Calendar Integrated Schedule & Trips View */}
      <SchoolCalendarView trips={recentTrips} />
    </div>
  );
}
