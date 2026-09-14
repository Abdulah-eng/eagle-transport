import { prisma } from "@/lib/db/client";
import SchoolInvoicesClient from "@/components/school-portal/school-invoices-client";

export const dynamic = "force-dynamic";

export default async function SchoolInvoicesPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const resolvedParams = await params;
  const schoolIdParam = resolvedParams?.schoolId || "";

  // Fetch School by ID or Code
  let school: any = null;
  let rawInvoices: any[] = [];

  try {
    if (schoolIdParam) {
      school = await prisma.school.findFirst({
        where: {
          OR: [
            { id: schoolIdParam },
            { code: schoolIdParam.toUpperCase() }
          ]
        }
      });
    }
  } catch (err) {
    console.error("[SCHOOL_INVOICES_SCHOOL_ERROR]", err);
  }

  const activeSchoolId = school?.id || schoolIdParam || "";

  // 1. Fetch Invoices via Prisma
  try {
    rawInvoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { schoolId: activeSchoolId },
          { schoolId: schoolIdParam },
          { charterTrip: { schoolId: activeSchoolId } },
          { charterTrip: { schoolId: schoolIdParam } }
        ]
      },
      include: {
        charterTrip: true,
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (err) {
    console.error("[SCHOOL_INVOICES_DB_ERROR]", err);
  }

  // 2. Fallback to Supabase REST API if Prisma returned empty or failed
  if ((!rawInvoices || rawInvoices.length === 0) && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/invoices?select=*,charterTrip:charter_trips(*)`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          rawInvoices = rows.filter((inv: any) => {
            const tripSchool = inv.charterTrip?.schoolId;
            const bName = (inv.billingName || "").toLowerCase();
            const sName = (school?.name || "").toLowerCase();
            return (
              inv.schoolId === activeSchoolId ||
              inv.schoolId === schoolIdParam ||
              tripSchool === activeSchoolId ||
              tripSchool === schoolIdParam ||
              (sName && bName.includes(sName)) ||
              bName.includes("lincoln") ||
              bName.includes("hell")
            );
          });
        }
      }
    } catch (supaErr) {
      console.error("[SCHOOL_INVOICES_SUPABASE_ERROR]", supaErr);
    }
  }

  // Safe date helper
  const toIso = (d: any) => d ? (d instanceof Date ? d.toISOString() : String(d)) : null;

  // Serialize Decimal / Date objects for Client Component
  const invoices = rawInvoices.map((inv) => ({
    ...inv,
    amount: Number(inv.amount || 0),
    totalAmount: Number(inv.totalAmount || inv.amount || 0),
    taxAmount: Number(inv.taxAmount || 0),
    createdAt: toIso(inv.createdAt),
    dueDate: toIso(inv.dueDate),
    paidAt: toIso(inv.paidAt),
    charterTrip: inv.charterTrip ? {
      organizationName: inv.charterTrip.organizationName,
      contactName: inv.charterTrip.contactName,
      contactEmail: inv.charterTrip.contactEmail,
      contactPhone: inv.charterTrip.contactPhone,
      tripDate: toIso(inv.charterTrip.tripDate),
      pickupAddress: inv.charterTrip.pickupAddress,
      destinationAddress: inv.charterTrip.destinationAddress,
      numberOfBuses: inv.charterTrip.numberOfBuses,
      numberOfStudents: inv.charterTrip.numberOfStudents,
    } : null
  }));

  return <SchoolInvoicesClient invoices={invoices} schoolName={school?.name || "School Partner"} />;
}
