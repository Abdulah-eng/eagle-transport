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

    const trip = await db.charterTrip.findUnique({
      where: { id: tripId },
      include: { assignments: true, tripQuote: true }
    })

    if (!trip) {
      return NextResponse.json({ error: "Charter trip not found" }, { status: 404 })
    }

    // Action 1: Create or Update Quote
    if (action === "create_quote") {
      if (!quoteAmount) {
        return NextResponse.json({ error: "Quote amount is required" }, { status: 400 })
      }

      const quote = await db.tripQuote.upsert({
        where: { tripId },
        update: {
          amount: parseFloat(quoteAmount),
          notes: notes || "Official Eagle Bus Charter Quote",
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
        create: {
          tripId,
          amount: parseFloat(quoteAmount),
          notes: notes || "Official Eagle Bus Charter Quote",
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        }
      })

      // Update trip status to QUOTED
      await db.charterTrip.update({
        where: { id: tripId },
        data: { status: "QUOTED" }
      })

      // Notify contact via Email
      await messagingService.sendEmail(
        trip.contactEmail,
        `Eagle Bus Charter Quote Ready - ${trip.organizationName}`,
        `Hello ${trip.contactName},\n\nYour charter quote for ${trip.organizationName} on ${new Date(trip.tripDate).toLocaleDateString()} is ready: $${parseFloat(quoteAmount).toFixed(2)}.\n\nThank you for choosing Eagle Bus!`,
        `<div style="font-family: sans-serif; padding: 20px;">
          <h2>Eagle Bus Charter Quote</h2>
          <p>Dear ${trip.contactName},</p>
          <p>We are pleased to provide your quote for the upcoming trip on <strong>${new Date(trip.tripDate).toLocaleDateString()}</strong>.</p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; color: #1e40af;">
            Total Quoted Amount: $${parseFloat(quoteAmount).toFixed(2)}
          </div>
          <p style="margin-top: 15px;">Number of Buses: ${trip.numberOfBuses} | Passengers: ${trip.numberOfStudents}</p>
        </div>`
      )

      return NextResponse.json({ success: true, message: "Quote generated and sent to customer", quote })
    }

    // Action 2: Assign Driver and Bus
    if (action === "assign_driver_bus") {
      if (!driverId && !busId) {
        return NextResponse.json({ error: "Driver or Bus ID required" }, { status: 400 })
      }

      // Upsert trip assignment
      const existingAssignment = trip.assignments[0]
      if (existingAssignment) {
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

      // Update status to SCHEDULED
      await db.charterTrip.update({
        where: { id: tripId },
        data: { status: "SCHEDULED" }
      })

      // Sync to Google Calendar
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
        await db.charterTrip.update({
          where: { id: tripId },
          data: { calendarEventId }
        })
      }

      // Notify Driver via Messaging
      if (driverId) {
        const driver = await db.driver.findUnique({ where: { id: driverId } })
        if (driver) {
          await messagingService.notifyDriver(driver, trip)
        }
      }

      return NextResponse.json({
        success: true,
        message: "Driver and bus assigned successfully. Trip synced to Google Calendar."
      })
    }

    // Action 3: Generate QuickBooks Invoice
    if (action === "create_qb_invoice") {
      const amount = trip.tripQuote?.amount ? Number(trip.tripQuote.amount) : 500.00
      const qbInvoiceId = await quickbooksService.createInvoice({
        customerName: trip.billingName || trip.organizationName,
        customerEmail: trip.billingEmail || trip.contactEmail,
        amount,
        description: `Charter Bus Transportation for ${trip.organizationName} on ${new Date(trip.tripDate).toLocaleDateString()}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      // Save Invoice in local DB
      const invoice = await db.invoice.create({
        data: {
          invoiceNumber: `INV-CHARTER-${Date.now().toString().slice(-5)}`,
          type: "CHARTER",
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

      return NextResponse.json({
        success: true,
        message: "QuickBooks Invoice generated and linked to charter trip.",
        invoice
      })
    }

    // Action 4: General Status Update
    if (action === "update_status") {
      if (!status) {
        return NextResponse.json({ error: "Status required" }, { status: 400 })
      }

      const updated = await db.charterTrip.update({
        where: { id: tripId },
        data: { status }
      })

      return NextResponse.json({ success: true, message: `Trip status updated to ${status}`, trip: updated })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("[CHARTER_TRIPS_POST]", error)
    return NextResponse.json({ error: "Failed to update charter trip" }, { status: 500 })
  }
}
