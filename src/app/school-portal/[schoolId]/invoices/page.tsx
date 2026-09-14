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

    const activeSchoolId = school?.id || "";

    // Fetch Real Invoices from DB for this school
    rawInvoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { schoolId: activeSchoolId },
          { charterTrip: { schoolId: activeSchoolId } }
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
