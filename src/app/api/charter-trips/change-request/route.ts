import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { messagingService } from "@/lib/integrations/messaging"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tripId, invoiceNumber, requestType, requestedTripDate, requestedStagingTime, reason } = body

    if (!requestType || !["RESCHEDULE", "CANCEL"].includes(requestType)) {
      return NextResponse.json({ error: "Invalid request type. Must be RESCHEDULE or CANCEL." }, { status: 400 })
    }

    let trip: any = null

    if (tripId) {
      trip = await db.charterTrip.findUnique({
        where: { id: tripId },
        include: { invoices: true }
      })
    } else if (invoiceNumber) {
      const invoice = await db.invoice.findFirst({
        where: {
          OR: [
            { invoiceNumber: invoiceNumber },
            { id: invoiceNumber }
          ]
        },
        include: { charterTrip: true }
      })
      if (invoice?.charterTrip) {
        trip = invoice.charterTrip
      }
    }

    if (!trip) {
      return NextResponse.json({ error: "Charter trip not found." }, { status: 404 })
    }

    const isReschedule = requestType === "RESCHEDULE"
    const newStatus = isReschedule ? "RESCHEDULE_REQUESTED" : "CANCELLATION_REQUESTED"

    const updatedTrip = await db.charterTrip.update({
      where: { id: trip.id },
      data: {
        status: newStatus as any,
        changeRequestNotes: reason || "",
        ...(isReschedule && requestedTripDate ? {
          requestedTripDate: new Date(requestedTripDate)
        } : {})
      }
    })

    const tripDateFormatted = new Date(trip.tripDate).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    })
    const requestedDateFormatted = requestedTripDate 
      ? new Date(requestedTripDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : "N/A"

    // 1. Notify Eagle Bus Operations Dispatch
    const adminEmailSubject = `[URGENT] Field Trip ${isReschedule ? 'Reschedule' : 'Cancellation'} Request - ${trip.organizationName}`
    const adminEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: ${isReschedule ? '#d97706' : '#dc2626'}; font-size: 20px;">
          Field Trip ${isReschedule ? 'Reschedule' : 'Cancellation'} Request
        </h2>
        <p>A customer has requested to <strong>${isReschedule ? 'RESCHEDULE' : 'CANCEL'}</strong> their charter bus trip.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 6px; font-weight: bold;">Organization:</td><td>${trip.organizationName}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Contact Name:</td><td>${trip.contactName}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Contact Email:</td><td>${trip.contactEmail}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Contact Phone:</td><td>${trip.contactPhone || 'N/A'}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Original Trip Date:</td><td>${tripDateFormatted}</td></tr>
          ${isReschedule ? `<tr><td style="padding: 6px; font-weight: bold; color: #d97706;">Proposed New Date:</td><td style="font-weight: bold; color: #d97706;">${requestedDateFormatted} ${requestedStagingTime ? `(${requestedStagingTime})` : ''}</td></tr>` : ''}
          <tr><td style="padding: 6px; font-weight: bold;">Reason / Notes:</td><td>${reason || 'No details provided'}</td></tr>
        </table>
        <p style="margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://theeaglebus.com'}/admin/charter-trips" 
             style="background: #0284c7; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Open Eagle Ops to Process Request
          </a>
        </p>
      </div>
    `

    await messagingService.sendEmail(
      process.env.EMAIL_FROM || "Info@eaglebusservice.com",
      adminEmailSubject,
      `Field Trip ${isReschedule ? 'Reschedule' : 'Cancellation'} Request for ${trip.organizationName}.\nReason: ${reason || 'N/A'}`,
      adminEmailBody
    ).catch(err => console.warn("Failed sending admin notification email:", err))

    // 2. Send Confirmation Email to Customer
    const customerEmail = trip.billingEmail || trip.contactEmail
    if (customerEmail) {
      const customerEmailSubject = `Eagle Bus Service - Field Trip ${isReschedule ? 'Reschedule' : 'Cancellation'} Request Received`
      const customerEmailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; font-size: 20px;">We Received Your ${isReschedule ? 'Reschedule' : 'Cancellation'} Request</h2>
          <p>Dear ${trip.contactName},</p>
          <p>We have received your request to <strong>${isReschedule ? 'reschedule' : 'cancel'}</strong> your field trip for <strong>${trip.organizationName}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Original Trip Date:</strong> ${tripDateFormatted}</p>
            ${isReschedule ? `<p style="margin: 0 0 8px 0; color: #d97706;"><strong>Requested New Date:</strong> ${requestedDateFormatted} ${requestedStagingTime ? `at ${requestedStagingTime}` : ''}</p>` : ''}
            <p style="margin: 0;"><strong>Notes:</strong> ${reason || 'N/A'}</p>
          </div>

          <p>Our dispatch operations team is reviewing your request and will contact you shortly to confirm the details. If you have immediate questions, please call dispatch at <strong>(704) 606-5661</strong>.</p>
          
          <p style="margin-top: 25px; font-size: 12px; color: #64748b;">Eagle Bus Transportation Services • Info@eaglebusservice.com</p>
        </div>
      `

      await messagingService.sendEmail(
        customerEmail,
        customerEmailSubject,
        `We have received your request to ${isReschedule ? 'reschedule' : 'cancel'} your field trip for ${trip.organizationName}.`,
        customerEmailBody
      ).catch(err => console.warn("Failed sending customer confirmation email:", err))
    }

    return NextResponse.json({
      success: true,
      message: `Your ${isReschedule ? 'reschedule' : 'cancellation'} request has been submitted to Eagle Bus Operations.`,
      trip: updatedTrip
    })

  } catch (error: any) {
    console.error("[CHANGE_REQUEST_POST_ERROR]", error)
    return NextResponse.json({ error: error.message || "Failed to process change request" }, { status: 500 })
  }
}
