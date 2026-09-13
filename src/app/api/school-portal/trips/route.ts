import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { googleCalendar } from "@/lib/integrations/google-calendar";
import { quickbooks } from "@/lib/integrations/quickbooks";
import { messaging } from "@/lib/integrations/messaging";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { schoolId, organizationName, contactName, contactEmail, contactPhone, tripDate, pickupAddress, destinationAddress, numberOfStudents, numberOfBuses, stagingTime, specialInstructions } = data;

    if (!schoolId || !organizationName || !contactName || !contactEmail || !tripDate) {
      return NextResponse.json({ error: "Missing required trip fields" }, { status: 400 });
    }

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Create Charter Trip record linked to School
    const trip = await prisma.charterTrip.create({
      data: {
        schoolId: school.id,
        organizationName,
        contactName,
        contactEmail,
        contactPhone,
        billingName: school.name,
        billingEmail: contactEmail,
        tripDate: new Date(tripDate),
        pickupAddress: pickupAddress || school.address || "Main Campus",
        stagingTime: stagingTime ? new Date(`${tripDate}T${stagingTime}`) : null,
        destinationName: destinationAddress,
        destinationAddress,
        numberOfStudents: Number(numberOfStudents) || 1,
        numberOfBuses: Number(numberOfBuses) || 1,
        specialInstructions,
        tripType: "FIELD_TRIP",
        status: "NEW"
      }
    });

    // Create Google Calendar event
    const eventStagingTime = trip.stagingTime || trip.tripDate;
    const eventId = await googleCalendar.createTripEvent({
      tripId: trip.id,
      organizationName: trip.organizationName,
      contactName: trip.contactName,
      pickupAddress: trip.pickupAddress,
      destinationAddress: trip.destinationAddress,
      stagingTime: eventStagingTime,
      numberOfBuses: trip.numberOfBuses,
      numberOfStudents: trip.numberOfStudents,
      tripStatus: trip.status
    });

    if (eventId) {
      await prisma.charterTrip.update({
        where: { id: trip.id },
        data: { calendarEventId: eventId }
      });
    }

    // Create QuickBooks draft invoice
    const qbInvoiceId = await quickbooks.createInvoice({
      customerName: trip.billingName,
      customerEmail: trip.billingEmail,
      lineItems: [{ description: `Portal Field Trip Request - ${trip.organizationName}`, amount: 0 }],
      notes: `School ID: ${school.id} | Trip ID: ${trip.id}`
    });

    if (qbInvoiceId) {
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          type: "CHARTER",
          schoolId: school.id,
          charterTripId: trip.id,
          billingName: trip.billingName,
          billingEmail: trip.billingEmail,
          amount: 0,
          totalAmount: 0,
          quickbooksInvoiceId: qbInvoiceId,
          status: "DRAFT"
        }
      });
    }

    // Send confirmation email
    await messaging.sendBookingConfirmation(
      { email: trip.contactEmail, name: trip.contactName },
      { id: trip.id, organizationName: trip.organizationName, tripDate: trip.tripDate }
    );

    return NextResponse.json({ success: true, trip });
  } catch (error: any) {
    console.error("Portal Trip Creation Error:", error);
    return NextResponse.json({ error: "Failed to create portal trip" }, { status: 500 });
  }
}
