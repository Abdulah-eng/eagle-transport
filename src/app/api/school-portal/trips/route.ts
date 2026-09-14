import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { googleCalendar } from "@/lib/integrations/google-calendar";
import { quickbooks } from "@/lib/integrations/quickbooks";
import { messaging } from "@/lib/integrations/messaging";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      schoolId, organizationName, contactName, contactEmail, 
      contactPhone, tripDate, pickupAddress, destinationAddress, 
      numberOfStudents, numberOfBuses, stagingTime, specialInstructions 
    } = data;

    if (!organizationName || !contactName || !contactEmail || !tripDate) {
      return NextResponse.json({ error: "Missing required trip fields" }, { status: 400 });
    }

    let school: any = null;
    try {
      if (schoolId) {
        school = await prisma.school.findFirst({
          where: {
            OR: [
              { id: schoolId },
              { code: schoolId.toUpperCase() }
            ]
          }
        });
      }
    } catch (err) {
      console.warn("[API_PORTAL_TRIPS] Prisma school find failed:", err);
    }

    if (!school && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supaRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/schools?select=*`, {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        });
        if (supaRes.ok) {
          const rows = await supaRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            school = rows.find((s: any) => s.id === schoolId || s.code === schoolId?.toUpperCase()) || rows[0];
          }
        }
      } catch (supaErr) {
        console.error("[API_PORTAL_TRIPS] Supabase school fetch failed:", supaErr);
      }
    }

    const activeSchoolId = school?.id || schoolId || "sch_lincoln_001";
    const schoolName = school?.name || "Lincoln High School";

    const tripId = "trip_portal_" + Date.now();
    const tripPayload = {
      id: tripId,
      schoolId: activeSchoolId,
      organizationName,
      contactName,
      contactEmail,
      contactPhone: contactPhone || "",
      billingName: schoolName,
      billingEmail: contactEmail,
      tripDate: new Date(tripDate).toISOString(),
      pickupAddress: pickupAddress || school?.address || "Main Campus",
      stagingTime: stagingTime ? new Date(`${tripDate}T${stagingTime}`).toISOString() : null,
      destinationName: destinationAddress || "Field Trip Location",
      destinationAddress: destinationAddress || "Field Trip Location",
      numberOfStudents: Number(numberOfStudents) || 1,
      numberOfBuses: Number(numberOfBuses) || 1,
      specialInstructions: specialInstructions || "",
      tripType: "FIELD_TRIP",
      status: "NEW",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let trip: any = null;
    try {
      trip = await prisma.charterTrip.create({
        data: {
          id: tripPayload.id,
          schoolId: activeSchoolId,
          organizationName,
          contactName,
          contactEmail,
          contactPhone,
          billingName: schoolName,
          billingEmail: contactEmail,
          tripDate: new Date(tripDate),
          pickupAddress: pickupAddress || school?.address || "Main Campus",
          stagingTime: stagingTime ? new Date(`${tripDate}T${stagingTime}`) : null,
          destinationName: destinationAddress || "Field Trip Location",
          destinationAddress: destinationAddress || "Field Trip Location",
          numberOfStudents: Number(numberOfStudents) || 1,
          numberOfBuses: Number(numberOfBuses) || 1,
          specialInstructions,
          tripType: "FIELD_TRIP",
          status: "NEW"
        }
      });
    } catch (dbErr) {
      console.warn("[API_PORTAL_TRIPS] Prisma charterTrip create failed, trying Supabase REST API:", dbErr);
    }

    if (!trip && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supaRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips`, {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(tripPayload)
        });
        if (supaRes.ok) {
          const rows = await supaRes.json();
          if (Array.isArray(rows) && rows.length > 0) trip = rows[0];
        }
      } catch (supaErr) {
        console.error("[API_PORTAL_TRIPS] Supabase charterTrip POST failed:", supaErr);
      }
    }

    if (!trip) {
      trip = tripPayload;
    }

    // Google Calendar Event (isolated try-catch)
    try {
      const eventStagingTime = trip.stagingTime ? new Date(trip.stagingTime) : new Date(trip.tripDate);
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
        try {
          await prisma.charterTrip.update({
            where: { id: trip.id },
            data: { calendarEventId: eventId }
          });
        } catch {}
      }
    } catch (calErr) {
      console.warn("[API_PORTAL_TRIPS] Google Calendar event creation warning:", calErr);
    }

    // QuickBooks Invoice (isolated try-catch)
    try {
      const qbInvoiceId = await quickbooks.createInvoice({
        customerName: trip.billingName || schoolName,
        customerEmail: trip.billingEmail || contactEmail,
        lineItems: [{ description: `Portal Field Trip Request - ${trip.organizationName}`, amount: 0 }],
        notes: `School ID: ${activeSchoolId} | Trip ID: ${trip.id}`
      });

      if (qbInvoiceId) {
        try {
          await prisma.invoice.create({
            data: {
              invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
              type: "CHARTER",
              schoolId: activeSchoolId,
              charterTripId: trip.id,
              billingName: trip.billingName || schoolName,
              billingEmail: trip.billingEmail || contactEmail,
              amount: 0,
              totalAmount: 0,
              quickbooksInvoiceId: qbInvoiceId,
              status: "DRAFT"
            }
          });
        } catch {}
      }
    } catch (qbErr) {
      console.warn("[API_PORTAL_TRIPS] QuickBooks invoice creation warning:", qbErr);
    }

    // Messaging confirmation (isolated try-catch)
    try {
      await messaging.sendBookingConfirmation(
        { email: trip.contactEmail, name: trip.contactName },
        { id: trip.id, organizationName: trip.organizationName, tripDate: trip.tripDate }
      );
    } catch (msgErr) {
      console.warn("[API_PORTAL_TRIPS] Email confirmation warning:", msgErr);
    }

    return NextResponse.json({ success: true, trip });
  } catch (error: any) {
    console.error("Portal Trip Creation Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create portal trip" }, { status: 500 });
  }
}
