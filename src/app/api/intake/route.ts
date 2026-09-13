import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { googleCalendar } from "@/lib/integrations/google-calendar";
import { quickbooks } from "@/lib/integrations/quickbooks";
import { messaging } from "@/lib/integrations/messaging";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { serviceType, contactName, contactEmail, contactPhone } = data;

    if (!serviceType || !contactName || !contactEmail) {
      return NextResponse.json({ error: "Missing required contact fields" }, { status: 400 });
    }

    if (serviceType === "field_trip") {
      // 1. Create Charter Trip Record
      const trip = await prisma.charterTrip.create({
        data: {
          organizationName: data.organizationName,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          billingName: data.billingName,
          billingEmail: data.billingEmail,
          tripDate: new Date(data.tripDate),
          pickupAddress: data.pickupAddress,
          stagingTime: data.stagingTime ? new Date(`${data.tripDate}T${data.stagingTime}`) : null,
          destinationName: data.destinationAddress, // Using address as name if not provided separately
          destinationAddress: data.destinationAddress,
          numberOfStudents: data.numberOfStudents,
          numberOfBuses: data.numberOfBuses,
          specialInstructions: data.specialInstructions,
          tripType: "FIELD_TRIP",
          status: "NEW"
        }
      });

      // 2. Create Google Calendar Event
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

      // 3. Create QuickBooks Invoice
      const qbInvoiceId = await quickbooks.createInvoice({
        customerName: trip.billingName,
        customerEmail: trip.billingEmail,
        lineItems: [{ description: `Field Trip Request - ${trip.organizationName}`, amount: 0 }],
        notes: `Trip ID: ${trip.id}`
      });

      if (qbInvoiceId) {
        // Create local invoice record
        await prisma.invoice.create({
          data: {
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            type: "CHARTER",
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

      // 4. Send Confirmation Email to Customer
      await messaging.sendBookingConfirmation(
        { email: trip.contactEmail, name: trip.contactName },
        { id: trip.id, organizationName: trip.organizationName, tripDate: trip.tripDate }
      );

      return NextResponse.json({ success: true, tripId: trip.id });

    } else if (serviceType === "school_transport") {
      // Handle School Transport Registration
      const code = data.schoolCode.toUpperCase();
      
      // Upsert School based on code
      let school = await prisma.school.findUnique({ 
        where: { code },
        include: { settings: true } 
      });
      if (!school) {
        school = await prisma.school.create({
          data: { name: `School - ${code}`, code },
          include: { settings: true }
        });
      }

      // Calculate School Capacity & Waitlist Status
      const maxCapacity = school.settings?.maxCapacityPerBus || 60;
      const currentApprovedCount = await prisma.registration.count({
        where: {
          schoolId: school.id,
          status: { in: ["APPROVED", "PENDING_REVIEW"] }
        }
      });

      const initialStatus = currentApprovedCount >= maxCapacity ? "WAITLISTED" : "PENDING_REVIEW";
      const initialPaymentStatus = initialStatus === "WAITLISTED" ? "WAITLISTED" : "PENDING_PAYMENT";

      // Find existing user or create Parent
      let user = await prisma.user.findUnique({
        where: { email: data.contactEmail },
        include: { parent: true }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: data.contactEmail,
            name: data.contactName,
            role: "PARENT",
            parent: {
              create: {
                firstName: data.contactName.split(" ")[0] || "Unknown",
                lastName: data.contactName.split(" ").slice(1).join(" ") || "Unknown",
                email: data.contactEmail,
                phone1: data.contactPhone,
              }
            }
          },
          include: { parent: true }
        });
      } else if (!user.parent) {
        const parent = await prisma.parent.create({
          data: {
            userId: user.id,
            firstName: data.contactName.split(" ")[0] || "Unknown",
            lastName: data.contactName.split(" ").slice(1).join(" ") || "Unknown",
            email: data.contactEmail,
            phone1: data.contactPhone,
          }
        });
        user.parent = parent;
      }

      // Create Student
      const student = await prisma.student.create({
        data: {
          parentId: user.parent!.id,
          schoolId: school.id,
          firstName: data.studentFirstName,
          lastName: data.studentLastName,
          grade: data.grade,
        }
      });

      // Create Registration
      const registration = await prisma.registration.create({
        data: {
          studentId: student.id,
          schoolId: school.id,
          schoolCode: code,
          serviceType: data.serviceNeeded === "BOTH" ? "AM_AND_PM" : (data.serviceNeeded === "AM" ? "AM_ONLY" : "PM_ONLY"),
          status: initialStatus,
          paymentStatus: initialPaymentStatus
        }
      });

      // Send status email (Waitlisted vs Received)
      const emailSubject = initialStatus === "WAITLISTED" 
        ? "Eagle Bus - Added to Waitlist" 
        : "Eagle Bus - Registration Received";
      
      const emailBody = initialStatus === "WAITLISTED"
        ? `Thank you for registering ${data.studentFirstName}. Standard bus capacity for ${school.name} is currently full. Your registration has been placed on the priority waitlist. We will notify you if a seat opens up.`
        : `We have received your school transportation registration for ${data.studentFirstName}. We will review it shortly.`;

      await messaging.sendEmail(data.contactEmail, emailSubject, emailBody);

      return NextResponse.json({ 
        success: true, 
        registrationId: registration.id,
        isWaitlisted: initialStatus === "WAITLISTED"
      });

    } else if (serviceType === "private_pay") {
      // Handle Private Pay Registration
      // Similar to school transport, but no school code required
      const parentUserId = `parent_${Date.now()}`;
      const parentUser = await prisma.user.create({
        data: {
          email: data.contactEmail,
          name: data.contactName,
          role: "PARENT",
          parent: {
            create: {
              firstName: data.contactName.split(" ")[0] || "Unknown",
              lastName: data.contactName.split(" ").slice(1).join(" ") || "Unknown",
              email: data.contactEmail,
              phone1: data.contactPhone,
            }
          }
        },
        include: { parent: true }
      });

      // We need a dummy school for private pay if the schema requires it, or we make it optional. 
      // Assuming we have a default 'Private Pay' school record, or we just create one.
      let privateSchool = await prisma.school.findFirst({ where: { name: "Private Pay" } });
      if (!privateSchool) {
        privateSchool = await prisma.school.create({ data: { name: "Private Pay", code: "PRIVATEPAY" }});
      }

      // Create Student
      const student = await prisma.student.create({
        data: {
          parentId: parentUser.parent!.id,
          schoolId: privateSchool.id,
          firstName: data.studentFirstName,
          lastName: data.studentLastName,
        }
      });

      // Create Registration
      const registration = await prisma.registration.create({
        data: {
          studentId: student.id,
          schoolId: privateSchool.id,
          schoolCode: "PRIVATEPAY",
          serviceType: data.serviceNeeded === "BOTH" ? "AM_AND_PM" : (data.serviceNeeded === "AM" ? "AM_ONLY" : "PM_ONLY"),
          status: "PENDING_REVIEW"
        }
      });
      
      await messaging.sendEmail(
        data.contactEmail, 
        "Eagle Bus - Private Pay Request Received", 
        `We have received your private transportation request for ${data.studentFirstName}. We will review it and send you a quote shortly.`
      );

      return NextResponse.json({ success: true, registrationId: registration.id });
    }

    return NextResponse.json({ error: "Invalid service type" }, { status: 400 });
  } catch (error: any) {
    console.error("Intake Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
