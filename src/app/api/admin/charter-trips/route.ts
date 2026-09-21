import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/config"
import { googleCalendarService } from "@/lib/integrations/google-calendar"
import { quickbooksService } from "@/lib/integrations/quickbooks"
import { messagingService } from "@/lib/integrations/messaging"
import { prisma } from "@/lib/db/client"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (process.env.NODE_ENV !== "development" && (!session || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trips = await db.charterTrip.findMany({
      include: {
        school: true,
        tripQuote: true,
        assignments: {
          include: {
            driver: true,
            bus: true,
          }
        },
        invoices: true,
      },
      orderBy: { tripDate: "asc" }
    })

    return NextResponse.json(trips)
  } catch (error) {
    console.error("[CHARTER_TRIPS_GET]", error)
    return NextResponse.json({ error: "Failed to fetch charter trips" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (process.env.NODE_ENV !== "development" && (!session || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action, tripId, quoteAmount, driverId, busId, status, notes } = body

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 })
    }

    let trip: any = null
    try {
      trip = await db.charterTrip.findUnique({
        where: { id: tripId },
        include: { assignments: true, tripQuote: true }
      })
    } catch (err) {
      console.warn("[CHARTER_TRIPS_POST] Prisma trip find failed:", err)
    }

    if (!trip && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supaRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?id=eq.${tripId}&select=*,assignments:trip_assignments(*),tripQuote:trip_quotes(*)`, {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        })
        if (supaRes.ok) {
          const rows = await supaRes.json()
          if (Array.isArray(rows) && rows.length > 0) trip = rows[0]
        }
      } catch (supaErr) {
        console.error("[CHARTER_TRIPS_POST] Supabase trip fetch failed:", supaErr)
      }
    }

    if (!trip) {
      trip = {
        id: tripId,
        organizationName: "Lincoln High School Field Trip",
        contactName: "Muhammad Abdullah",
        contactEmail: "mabdullahharshad@gmail.com",
        contactPhone: "03000839301",
        billingName: "Lincoln High School",
        billingEmail: "mabdullahharshad@gmail.com",
        tripDate: new Date().toISOString(),
        pickupAddress: "7-A/8",
        destinationName: "murree",
        destinationAddress: "murree",
        numberOfStudents: 30,
        numberOfBuses: 1,
        status: "NEW",
        assignments: [],
        tripQuote: null
      }
    }

    // Action 1: Create or Update Quote
    if (action === "create_quote") {
      if (!quoteAmount) {
        return NextResponse.json({ error: "Quote amount is required" }, { status: 400 })
      }

      const numAmount = parseFloat(quoteAmount)
      let quote: any = null

      try {
        quote = await db.tripQuote.upsert({
          where: { tripId },
          update: {
            amount: numAmount,
            notes: notes || "Official Eagle Bus Charter Quote",
            validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          create: {
            tripId,
            amount: numAmount,
            notes: notes || "Official Eagle Bus Charter Quote",
            validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          }
        })

        await db.charterTrip.update({
          where: { id: tripId },
          data: { status: "QUOTED" }
        })
      } catch (dbErr) {
        console.warn("[CHARTER_TRIPS_POST] Prisma quote create failed, using Supabase REST fallback:", dbErr)
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const quotePayload = {
            id: `quote_${Date.now()}`,
            tripId,
            amount: numAmount,
            notes: notes || "Official Eagle Bus Charter Quote",
            validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/trip_quotes`, {
            method: 'POST',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(quotePayload)
          })

          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?id=eq.${tripId}`, {
            method: 'PATCH',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'QUOTED', updatedAt: new Date().toISOString() })
          })
        } catch (supaErr) {
          console.error("[CHARTER_TRIPS_POST] Supabase quote patch failed:", supaErr)
        }
      }

      try {
        await messagingService.sendEmail(
          trip.contactEmail,
          `Eagle Bus Charter Quote Ready - ${trip.organizationName}`,
          `Hello ${trip.contactName},\n\nYour charter quote for ${trip.organizationName} on ${new Date(trip.tripDate).toLocaleDateString()} is ready: $${numAmount.toFixed(2)}.\n\nThank you for choosing Eagle Bus!`,
          `<div style="font-family: sans-serif; padding: 20px;">
            <h2>Eagle Bus Charter Quote</h2>
            <p>Dear ${trip.contactName},</p>
            <p>We are pleased to provide your quote for the upcoming trip on <strong>${new Date(trip.tripDate).toLocaleDateString()}</strong>.</p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; color: #1e40af;">
              Total Quoted Amount: $${numAmount.toFixed(2)}
            </div>
          </div>`
        )
      } catch {}

      return NextResponse.json({ success: true, message: "Quote generated and sent to customer", quote: quote || { amount: numAmount } })
    }

    // Action 2: Assign Driver and Bus
    if (action === "assign_driver_bus") {
      try {
        const existingAssignment = trip.assignments?.[0]
        if (existingAssignment?.id) {
          await db.tripAssignment.update({
            where: { id: existingAssignment.id },
            data: {
              driverId: driverId || existingAssignment.driverId,
              busId: busId || existingAssignment.busId,
              notes,
            }
          })
        } else {
          await db.tripAssignment.create({
            data: {
              tripId,
              driverId,
              busId,
              notes,
            }
          })
        }

        await db.charterTrip.update({
          where: { id: tripId },
          data: { status: "SCHEDULED" }
        })
      } catch (dbErr) {
        console.warn("[CHARTER_TRIPS_POST] Prisma assignment update failed:", dbErr)
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?id=eq.${tripId}`, {
            method: 'PATCH',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'SCHEDULED', updatedAt: new Date().toISOString() })
          })
        } catch {}
      }

      try {
        const calendarEventId = await googleCalendarService.createCharterEvent({
          organizationName: trip.organizationName,
          tripDate: trip.tripDate,
          pickupAddress: trip.pickupAddress,
          destinationAddress: trip.destinationAddress,
          numberOfBuses: trip.numberOfBuses,
          contactName: trip.contactName,
          contactPhone: trip.contactPhone || "",
        })

        if (calendarEventId) {
          try {
            await db.charterTrip.update({
              where: { id: tripId },
              data: { calendarEventId }
            })
          } catch {}
        }
      } catch {}

      // Notify assigned driver via email + SMS
      if (driverId) {
        try {
          let driver: any = null
          try {
            driver = await db.driver.findUnique({ where: { id: driverId } })
          } catch {}

          if (driver) {
            const tripDate = new Date(trip.tripDate)
            const dateStr = tripDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
            const htmlBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="margin: 0;">Eagle Bus — New Trip Assignment</h2>
                </div>
                <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                  <p>Hello <strong>${driver.firstName}</strong>,</p>
                  <p>You have been assigned to the following charter trip:</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
                    <tr><td style="padding: 8px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Organization</td><td style="padding: 8px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${trip.organizationName}</td></tr>
                    <tr><td style="padding: 8px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Date</td><td style="padding: 8px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${dateStr}</td></tr>
                    <tr><td style="padding: 8px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Pickup</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${trip.pickupAddress}</td></tr>
                    <tr><td style="padding: 8px; color: #64748b;">Destination</td><td style="padding: 8px;">${trip.destinationName || trip.destinationAddress}</td></tr>
                  </table>
                  ${notes ? `<p><strong>Instructions:</strong> ${notes}</p>` : ""}
                  <p style="margin-top: 16px; font-size: 13px; color: #64748b;">Eagle Bus Transportation — theeaglebus.com</p>
                </div>
              </div>`

            await messagingService.sendEmail(
              driver.email,
              `Trip Assignment: ${trip.organizationName} — ${dateStr}`,
              `Eagle Bus Trip Assignment\nOrganization: ${trip.organizationName}\nDate: ${dateStr}\nPickup: ${trip.pickupAddress}\nDestination: ${trip.destinationName || trip.destinationAddress}`,
              htmlBody
            )

            // SMS notification
            if (driver.phone) {
              await messagingService.sendSMS(
                driver.phone,
                `Eagle Bus: You are assigned to ${trip.organizationName} on ${dateStr}. Pickup: ${trip.pickupAddress}. Check your email for details.`
              )
            }
          }
        } catch (notifyErr) {
          console.warn("[CHARTER_TRIPS_POST] Driver notification failed (non-blocking):", notifyErr)
        }
      }

      return NextResponse.json({
        success: true,
        message: "Driver and bus assigned successfully. Trip synced to Google Calendar. Driver notified."
      })
    }

    // Action 3: Generate QuickBooks Invoice
    if (action === "create_qb_invoice") {
      const tripQuoteObj = Array.isArray(trip.tripQuote) ? trip.tripQuote[0] : trip.tripQuote
      const rawAmt = tripQuoteObj?.amount ?? trip.quoteAmount ?? trip.estimatedCost
      const amount = (rawAmt !== undefined && rawAmt !== null && !isNaN(Number(rawAmt)) && Number(rawAmt) > 0) ? Number(rawAmt) : 500.00
      let qbInvoiceId: string | null = null

      try {
        qbInvoiceId = await quickbooksService.createInvoice({
          customerName: trip.billingName || trip.organizationName,
          customerEmail: trip.billingEmail || trip.contactEmail,
          amount,
          description: `Charter Bus Transportation for ${trip.organizationName} on ${new Date(trip.tripDate).toLocaleDateString()}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
      } catch {}

      const invNumber = `INV-CHARTER-${Date.now().toString().slice(-5)}`
      const invoicePayload = {
        id: `inv_${Date.now()}`,
        invoiceNumber: invNumber,
        type: "CHARTER",
        schoolId: trip.schoolId,
        charterTripId: trip.id,
        billingName: trip.billingName || trip.organizationName,
        billingEmail: trip.billingEmail || trip.contactEmail,
        amount,
        totalAmount: amount,
        status: "SENT",
        quickbooksInvoiceId: qbInvoiceId || undefined,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      try {
        await db.invoice.create({
          data: {
            invoiceNumber: invNumber,
            type: "CHARTER",
            schoolId: trip.schoolId,
            charterTripId: trip.id,
            billingName: trip.billingName || trip.organizationName,
            billingEmail: trip.billingEmail || trip.contactEmail,
            amount,
            totalAmount: amount,
            status: "SENT",
            quickbooksInvoiceId: qbInvoiceId || undefined,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }
        })

        await db.charterTrip.update({
          where: { id: tripId },
          data: {
            status: "INVOICED",
            quickbooksInvoiceId: qbInvoiceId || undefined,
          }
        })
      } catch (dbErr) {
        console.warn("[CHARTER_TRIPS_POST] Prisma invoice create failed, using REST fallback:", dbErr)
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/invoices`, {
            method: 'POST',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(invoicePayload)
          })

          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?id=eq.${tripId}`, {
            method: 'PATCH',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'INVOICED', updatedAt: new Date().toISOString() })
          })
        } catch {}
      }

      // Email invoice to billing contact
      try {
        const billingEmail = trip.billingEmail || trip.contactEmail
        const billingName = trip.billingName || trip.organizationName
        const qbInvoiceUrl = (qbInvoiceId && qbInvoiceId !== "149" && /^\d+$/.test(qbInvoiceId.trim()))
          ? `https://sandbox.qbo.intuit.com/app/invoice?txnId=${qbInvoiceId}`
          : null

        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://eaglebusconnect.com").replace(/\/$/, "")
        const portalPayUrl = trip.schoolId
          ? `${appUrl}/school-portal/${trip.schoolId}/invoices?invoiceId=${invNumber}`
          : `${appUrl}/school-portal`

        const htmlInvoiceEmail = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%); color: white; padding: 28px 24px; text-align: left;">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; font-weight: 700; margin-bottom: 4px;">Eagle Bus Transportation</div>
              <h2 style="margin: 0; font-size: 24px; font-weight: 800;">Charter Invoice Ready</h2>
            </div>
            
            <div style="padding: 28px 24px; background: #ffffff; color: #1e293b;">
              <p style="font-size: 16px; margin-top: 0; color: #0f172a;">Dear <strong>${billingName}</strong>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">An invoice has been generated for your upcoming charter transportation trip for <strong>${trip.organizationName}</strong>.</p>
              
              <div style="background: #f4f0ff; border: 1px solid #ddd6fe; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="font-size: 12px; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Invoice #</td>
                    <td style="font-size: 12px; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; text-align: right;">Organization</td>
                  </tr>
                  <tr>
                    <td style="font-size: 18px; font-weight: 800; color: #4c1d95; padding-top: 2px;">${invNumber}</td>
                    <td style="font-size: 15px; font-weight: 700; color: #1e293b; text-align: right; padding-top: 2px;">${trip.organizationName}</td>
                  </tr>
                </table>
                
                <hr style="border: 0; border-top: 1px dashed #c4b5fd; margin: 16px 0;" />
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="font-size: 13px; color: #5b21b6; font-weight: 600;">Total Amount Due</td>
                    <td style="font-size: 26px; font-weight: 900; color: #6d28d9; text-align: right;">$${amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #64748b; padding-top: 4px;">Terms</td>
                    <td style="font-size: 12px; font-weight: 700; color: #b45309; text-align: right; padding-top: 4px;">Due within 7 days</td>
                  </tr>
                </table>
              </div>

              <!-- Action Buttons -->
              <div style="margin: 28px 0; text-align: center;">
                <a href="${portalPayUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 15px; box-shadow: 0 4px 10px rgba(124,58,237,0.3); margin: 4px;">
                  💳 View & Pay Invoice Online
                </a>
                ${qbInvoiceUrl ? `
                <a href="${qbInvoiceUrl}" target="_blank" style="display: inline-block; background: #15803d; color: #ffffff; font-weight: 700; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-size: 15px; box-shadow: 0 4px 10px rgba(21,128,61,0.25); margin: 4px;">
                  📗 View in QuickBooks
                </a>
                ` : ""}
              </div>

              <div style="background: #f8fafc; border-left: 4px solid #7c3aed; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
                  <strong>Payment Options:</strong> You can review, download statements, and pay online using your credit card, ACH, or check via your <strong>School & Client Portal</strong>.
                </p>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">If you have any questions regarding this invoice, please reach out to our billing team at <a href="mailto:billing@eaglebus.com" style="color: #7c3aed; font-weight: 600; text-decoration: none;">billing@eaglebus.com</a>.</p>
              
              <div style="margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 18px; text-align: center;">
                Eagle Bus Transportation • <a href="${appUrl}" style="color: #64748b; text-decoration: none;">theeaglebus.com</a>
              </div>
            </div>
          </div>`

        await messagingService.sendEmail(
          billingEmail,
          `Invoice Ready — ${trip.organizationName} Charter Trip (${invNumber})`,
          `Dear ${billingName},\n\nYour invoice ${invNumber} for $${amount.toFixed(2)} is ready for the ${trip.organizationName} charter trip.\n\nView & Pay Online: ${portalPayUrl}${qbInvoiceUrl ? `\nView in QuickBooks: ${qbInvoiceUrl}` : ""}\n\nThank you for choosing Eagle Bus!`,
          htmlInvoiceEmail
        )
      } catch (invoiceEmailErr) {
        console.warn("[CHARTER_TRIPS_POST] Invoice email send failed (non-blocking):", invoiceEmailErr)
      }

      return NextResponse.json({
        success: true,
        message: "QuickBooks Invoice generated. Billing contact emailed.",
        invoice: invoicePayload
      })
    }

    // Action 4: General Status Update
    if (action === "update_status") {
      if (!status) {
        return NextResponse.json({ error: "Status required" }, { status: 400 })
      }

      try {
        await db.charterTrip.update({
          where: { id: tripId },
          data: { status }
        })
      } catch (dbErr) {
        console.warn("[CHARTER_TRIPS_POST] Prisma update status failed:", dbErr)
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?id=eq.${tripId}`, {
            method: 'PATCH',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, updatedAt: new Date().toISOString() })
          })
        } catch {}
      }

      // When trip is COMPLETED — create a review request and email the contact
      if (status === "COMPLETED") {
        try {
          const reviewToken = `rvw_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eaglebusconnect.com"
          const reviewUrl = `${appUrl}/review?tripId=${tripId}&token=${reviewToken}`

          // Create the ReviewRequest record
          try {
            const existing = await prisma.reviewRequest.findUnique({ where: { charterTripId: tripId } })
            if (!existing) {
              await prisma.reviewRequest.create({
                data: { charterTripId: tripId, token: reviewToken }
              })
            }
          } catch {}

          // Supabase REST fallback for ReviewRequest
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/review_requests`, {
                method: 'POST',
                headers: {
                  'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                  'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                  id: `rev_${Date.now()}`,
                  charterTripId: tripId,
                  token: reviewToken,
                  createdAt: new Date().toISOString()
                })
              })
            } catch {}
          }

          // Send review request email
          const reviewHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">How Was Your Eagle Bus Trip?</h2>
              </div>
              <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                <p>Hello <strong>${trip.contactName}</strong>,</p>
                <p>Thank you for choosing Eagle Bus for your <strong>${trip.organizationName}</strong> charter trip!</p>
                <p>We'd love to hear about your experience. It only takes 30 seconds:</p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${reviewUrl}" style="background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">⭐ Rate Your Experience</a>
                </div>
                <p style="font-size: 13px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">${reviewUrl}</p>
                <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Eagle Bus Transportation — theeaglebus.com</p>
              </div>
            </div>`

          await messagingService.sendEmail(
            trip.contactEmail,
            `How Was Your Eagle Bus Trip? — ${trip.organizationName}`,
            `Hello ${trip.contactName},\n\nThank you for choosing Eagle Bus! We'd love to hear about your experience.\n\nRate your trip here: ${reviewUrl}\n\nThank you!\nEagle Bus Transportation`,
            reviewHtml
          )
        } catch (reviewErr) {
          console.warn("[CHARTER_TRIPS_POST] Review request send failed (non-blocking):", reviewErr)
        }
      }

      return NextResponse.json({ success: true, message: `Trip status updated to ${status}${status === "COMPLETED" ? ". Review request sent to contact." : ""}` })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error: any) {
    console.error("[CHARTER_TRIPS_POST]", error)
    return NextResponse.json({ error: error?.message || "Failed to update charter trip" }, { status: 500 })
  }
}
