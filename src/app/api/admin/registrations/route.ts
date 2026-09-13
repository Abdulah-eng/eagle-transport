import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth/config";
import { messaging } from "@/lib/integrations/messaging";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (process.env.NODE_ENV !== "development" && (!session || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { registrationId, status } = body;

    if (!registrationId || !status) {
      return NextResponse.json({ error: "Registration ID and status are required" }, { status: 400 });
    }

    const existing = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        student: {
          include: {
            parent: true,
            school: true
          }
        },
        school: true
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Registration record not found" }, { status: 404 });
    }

    const updatedStatus = status as "APPROVED" | "REJECTED" | "WAITLISTED" | "PENDING_REVIEW";
    const paymentStatus = updatedStatus === "APPROVED" ? "PENDING_PAYMENT" : (updatedStatus === "WAITLISTED" ? "WAITLISTED" : existing.paymentStatus);

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: updatedStatus,
        paymentStatus,
        reviewedAt: new Date(),
        reviewedBy: session?.user?.email || "Admin"
      }
    });

    // Send email notification to parent
    const parentEmail = existing.student?.parent?.email;
    const studentName = `${existing.student?.firstName} ${existing.student?.lastName}`;
    const schoolName = existing.school?.name || existing.student?.school?.name || "Eagle Bus Partner School";

    if (parentEmail) {
      if (updatedStatus === "APPROVED") {
        await messaging.sendEmail(
          parentEmail,
          `Registration Approved - ${studentName}`,
          `Good news! The transportation registration for ${studentName} at ${schoolName} has been approved by Eagle Bus Service. You may now log into the parent portal to complete tuition payment.`,
          `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #166534; margin-top: 0;">Registration Approved</h2>
            <p>Dear Parent,</p>
            <p>We are pleased to inform you that the transportation registration for <strong>${studentName}</strong> at <strong>${schoolName}</strong> has been <strong>APPROVED</strong>!</p>
            <p>Service Type: <strong>${existing.serviceType}</strong></p>
            <p>Please log into your parent dashboard to review route assignments and manage payment options.</p>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Eagle Bus Transportation Service</p>
          </div>`
        );
      } else if (updatedStatus === "REJECTED") {
        await messaging.sendEmail(
          parentEmail,
          `Registration Update - ${studentName}`,
          `Your transportation registration for ${studentName} at ${schoolName} could not be approved at this time. Please contact Eagle Bus Service office for details.`,
          `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #991b1b; margin-top: 0;">Registration Update</h2>
            <p>Dear Parent,</p>
            <p>Thank you for submitting a transportation registration for <strong>${studentName}</strong> at <strong>${schoolName}</strong>.</p>
            <p>Regrettably, we cannot approve this registration at this time. If you have questions, please contact our dispatch office.</p>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Eagle Bus Transportation Service</p>
          </div>`
        );
      }
    }

    return NextResponse.json({
      success: true,
      registration: updated,
      message: `Registration ${updatedStatus === 'APPROVED' ? 'Approved' : 'Declined'} successfully.`
    });
  } catch (error: any) {
    console.error("[ADMIN_REGISTRATIONS_POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
