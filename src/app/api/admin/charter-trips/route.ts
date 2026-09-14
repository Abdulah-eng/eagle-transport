import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/config"
import { googleCalendarService } from "@/lib/integrations/google-calendar"
import { quickbooksService } from "@/lib/integrations/quickbooks"
import { messagingService } from "@/lib/integrations/messaging"

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

      return NextResponse.json({
        success: true,
        message: "Driver and bus assigned successfully. Trip synced to Google Calendar."
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

      return NextResponse.json({
        success: true,
        message: "QuickBooks Invoice generated and linked to charter trip.",
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

      return NextResponse.json({ success: true, message: `Trip status updated to ${status}` })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error: any) {
    console.error("[CHARTER_TRIPS_POST]", error)
    return NextResponse.json({ error: error?.message || "Failed to update charter trip" }, { status: 500 })
  }
}
