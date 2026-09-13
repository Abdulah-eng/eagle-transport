import { prisma } from "@/lib/db/client";
import SchoolInvoicesClient from "@/components/school-portal/school-invoices-client";

export const dynamic = "force-dynamic";

export default async function SchoolInvoicesPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const resolvedParams = await params;
  const schoolIdParam = resolvedParams?.schoolId || "";

  // Fetch School by ID or Code
  const school = await prisma.school.findFirst({
    where: {
      OR: [
        { id: schoolIdParam },
        { code: schoolIdParam.toUpperCase() }
      ]
    }
  });

  const activeSchoolId = school?.id || "";

  // Fetch Real Invoices from DB for this school
  const rawInvoices = await prisma.invoice.findMany({
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

  // Serialize Decimal / Date objects for Client Component
  const invoices = rawInvoices.map((inv) => ({
    ...inv,
    amount: Number(inv.amount || 0),
    totalAmount: Number(inv.totalAmount || inv.amount || 0),
    taxAmount: Number(inv.taxAmount || 0),
    createdAt: inv.createdAt.toISOString(),
    dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
    paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
    charterTrip: inv.charterTrip ? {
      organizationName: inv.charterTrip.organizationName,
      contactName: inv.charterTrip.contactName,
      contactEmail: inv.charterTrip.contactEmail,
      contactPhone: inv.charterTrip.contactPhone,
      tripDate: inv.charterTrip.tripDate.toISOString(),
      pickupAddress: inv.charterTrip.pickupAddress,
      destinationAddress: inv.charterTrip.destinationAddress,
      numberOfBuses: inv.charterTrip.numberOfBuses,
      numberOfStudents: inv.charterTrip.numberOfStudents,
    } : null
  }));

  return <SchoolInvoicesClient invoices={invoices} schoolName={school?.name || "School Partner"} />;
}
