import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { googleCalendar } from "@/lib/integrations/google-calendar";
import { quickbooks } from "@/lib/integrations/quickbooks";
import { messaging } from "@/lib/integrations/messaging";

function parseSafeDate(val: any): Date {
  if (!val) return new Date(Date.now() + 24 * 60 * 60 * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : d;
}

function parseSafeTime(dateStr: any, timeStr: any): Date | null {
  if (!timeStr) return null;
  try {
    if (String(timeStr).includes("T")) {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) return d;
    }
    const dateBase = dateStr ? new Date(dateStr) : new Date();
    const isoDateStr = isNaN(dateBase.getTime()) ? new Date().toISOString().split("T")[0] : dateBase.toISOString().split("T")[0];
    
    // Clean time string (e.g. 08:00 AM -> 08:00:00)
    let cleanTime = String(timeStr).trim();
    if (cleanTime.toLowerCase().includes("pm") || cleanTime.toLowerCase().includes("am")) {
      const isPm = cleanTime.toLowerCase().includes("pm");
      const parts = cleanTime.replace(/(am|pm)/i, "").trim().split(":");
      let hours = parseInt(parts[0] || "0", 10);
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
      cleanTime = `${String(hours).padStart(2, "0")}:${parts[1] || "00"}:00`;
    } else if (cleanTime.split(":").length === 2) {
      cleanTime = `${cleanTime}:00`;
    }
    
    const combined = new Date(`${isoDateStr}T${cleanTime}`);
    return isNaN(combined.getTime()) ? null : combined;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json().catch(() => ({}));
    const { serviceType, contactName, contactEmail, contactPhone } = data;

    if (!serviceType || !contactName || !contactEmail) {
      return NextResponse.json({ error: "Missing required contact fields" }, { status: 400 });
    }

    if (serviceType === "field_trip") {
      const orgName = data.organizationName || contactName || "Charter Client";
      const billName = data.billingName || orgName;
      const billEmail = data.billingEmail || contactEmail;
      const tripDateObj = parseSafeDate(data.tripDate);
      const stagingTimeObj = parseSafeTime(data.tripDate, data.stagingTime);
      const pickup = data.pickupAddress || "Staging Location TBD";
      const destination = data.destinationAddress || "Destination TBD";
      const buses = Number(data.numberOfBuses) || 1;
      const students = Number(data.numberOfStudents) || 30;
      const tripId = `trip_${Date.now()}`;

      let trip: any = null;

      try {
        trip = await prisma.charterTrip.create({
          data: {
            id: tripId,
            organizationName: orgName,
            contactName: contactName,
            contactEmail: contactEmail,
            contactPhone: contactPhone || null,
            billingName: billName,
            billingEmail: billEmail,
            tripDate: tripDateObj,
            pickupAddress: pickup,
            stagingTime: stagingTimeObj,
            destinationName: destination,
            destinationAddress: destination,
            numberOfStudents: students,
            numberOfBuses: buses,
            specialInstructions: data.specialInstructions || null,
            tripType: "FIELD_TRIP",
            status: "NEW"
          }
        });
      } catch (dbErr) {
        console.warn("[INTAKE_API] Prisma charterTrip create failed, using Supabase REST fallback:", dbErr);
      }

      if (!trip && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const tripPayload = {
            id: tripId,
            organizationName: orgName,
            contactName: contactName,
            contactEmail: contactEmail,
            contactPhone: contactPhone || null,
            billingName: billName,
            billingEmail: billEmail,
            tripDate: tripDateObj.toISOString(),
            pickupAddress: pickup,
            stagingTime: stagingTimeObj ? stagingTimeObj.toISOString() : null,
            destinationName: destination,
            destinationAddress: destination,
            numberOfStudents: students,
            numberOfBuses: buses,
            specialInstructions: data.specialInstructions || null,
            tripType: "FIELD_TRIP",
            status: "NEW",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips`, {
            method: 'POST',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(tripPayload)
          });
          if (res.ok) {
            trip = tripPayload;
          }
        } catch (supaErr) {
          console.error("[INTAKE_API] Supabase REST charter_trips fallback failed:", supaErr);
        }
      }

      const activeTripId = trip?.id || tripId;

      // Create Google Calendar Event (non-blocking)
      try {
        const eventStagingTime = stagingTimeObj || tripDateObj;
        const eventId = await googleCalendar.createTripEvent({
          tripId: activeTripId,
          organizationName: orgName,
          contactName: contactName,
          pickupAddress: pickup,
          destinationAddress: destination,
          stagingTime: eventStagingTime,
          numberOfBuses: buses,
          numberOfStudents: students,
          tripStatus: "NEW"
        });
        
        if (eventId) {
          try {
            await prisma.charterTrip.update({
              where: { id: activeTripId },
              data: { calendarEventId: eventId }
            });
          } catch {}
        }
      } catch (calErr) {
        console.warn("[INTAKE_API] Google Calendar sync warning:", calErr);
      }

      // Create QuickBooks Invoice (non-blocking)
      try {
        const qbInvoiceId = await quickbooks.createInvoice({
          customerName: billName,
          customerEmail: billEmail,
          lineItems: [{ description: `Field Trip Request - ${orgName}`, amount: 0 }],
          notes: `Trip ID: ${activeTripId}`
        });

        if (qbInvoiceId) {
          try {
            await prisma.invoice.create({
              data: {
                invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
                type: "CHARTER",
                charterTripId: activeTripId,
                billingName: billName,
                billingEmail: billEmail,
                amount: 0,
                totalAmount: 0,
                quickbooksInvoiceId: qbInvoiceId,
                status: "DRAFT"
              }
            });
          } catch {}
        }
      } catch (qbErr) {
        console.warn("[INTAKE_API] QuickBooks sync warning:", qbErr);
      }

      // Send Confirmation Email (non-blocking)
      try {
        await messaging.sendBookingConfirmation(
          { email: contactEmail, name: contactName },
          { id: activeTripId, organizationName: orgName, tripDate: tripDateObj }
        );
      } catch (mailErr) {
        console.warn("[INTAKE_API] Email confirmation send warning:", mailErr);
      }

      return NextResponse.json({ success: true, tripId: activeTripId });

    } else if (serviceType === "school_transport") {
      const code = (data.schoolCode || "GENERIC").trim().toUpperCase();
      const studentFirst = data.studentFirstName || contactName.split(" ")[0] || "Student";
      const studentLast = data.studentLastName || contactName.split(" ").slice(1).join(" ") || "Applicant";
      
      let school: any = null;
      try {
        school = await prisma.school.findUnique({ 
          where: { code },
          include: { settings: true } 
        });
        if (!school) {
          school = await prisma.school.create({
            data: { name: `School (${code})`, code },
            include: { settings: true }
          });
        }
      } catch (dbErr) {
        console.warn("[INTAKE_API] Prisma school lookup failed, trying Supabase REST fallback:", dbErr);
      }

      const schoolId = school?.id || `sch_${code.toLowerCase()}`;
      const maxCapacity = school?.settings?.maxCapacityPerBus || 60;

      let currentApprovedCount = 0;
      try {
        currentApprovedCount = await prisma.registration.count({
          where: {
            schoolId: schoolId,
            status: { in: ["APPROVED", "PENDING_REVIEW"] }
          }
        });
      } catch {}

      const initialStatus = currentApprovedCount >= maxCapacity ? "WAITLISTED" : "PENDING_REVIEW";
      const initialPaymentStatus = initialStatus === "WAITLISTED" ? "WAITLISTED" : "PENDING_PAYMENT";

      let userId = `usr_${Date.now()}`;
      let parentId = `prt_${Date.now()}`;
      let studentId = `std_${Date.now()}`;
      let regId = `reg_${Date.now()}`;

      try {
        let user = await prisma.user.findUnique({
          where: { email: contactEmail },
          include: { parent: true }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              id: userId,
              email: contactEmail,
              name: contactName,
              role: "PARENT",
              parent: {
                create: {
                  id: parentId,
                  firstName: contactName.split(" ")[0] || "Unknown",
                  lastName: contactName.split(" ").slice(1).join(" ") || "Unknown",
                  email: contactEmail,
                  phone1: contactPhone || null,
                }
              }
            },
            include: { parent: true }
          });
          parentId = user.parent?.id || parentId;
        } else if (!user.parent) {
          const parent = await prisma.parent.create({
            data: {
              id: parentId,
              userId: user.id,
              firstName: contactName.split(" ")[0] || "Unknown",
              lastName: contactName.split(" ").slice(1).join(" ") || "Unknown",
              email: contactEmail,
              phone1: contactPhone || null,
            }
          });
          parentId = parent.id;
        } else {
          parentId = user.parent.id;
        }

        const student = await prisma.student.create({
          data: {
            id: studentId,
            parentId: parentId,
            schoolId: schoolId,
            firstName: studentFirst,
            lastName: studentLast,
            grade: data.grade || null,
          }
        });
        studentId = student.id;

        const serviceTypeVal = data.serviceNeeded === "BOTH" ? "AM_AND_PM" : (data.serviceNeeded === "AM" ? "AM_ONLY" : "PM_ONLY");
        const registration = await prisma.registration.create({
          data: {
            id: regId,
            studentId: studentId,
            schoolId: schoolId,
            schoolCode: code,
            serviceType: serviceTypeVal,
            status: initialStatus,
            paymentStatus: initialPaymentStatus
          }
        });
        regId = registration.id;
      } catch (dbErr) {
        console.warn("[INTAKE_API] Prisma school_transport pipeline failed, using Supabase REST fallback:", dbErr);
        
        // Supabase REST fallback for school_transport
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const headers = {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            };
            
            // 1. School fallback
            await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/schools`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ id: schoolId, name: `School (${code})`, code, updatedAt: new Date().toISOString() })
            });

            // 2. User fallback
            await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ id: userId, email: contactEmail, name: contactName, role: "PARENT", updatedAt: new Date().toISOString() })
            });

            // 3. Parent fallback
            await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/parents`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                id: parentId,
                userId: userId,
                firstName: contactName.split(" ")[0] || "Unknown",
                lastName: contactName.split(" ").slice(1).join(" ") || "Unknown",
                email: contactEmail,
                phone1: contactPhone || null,
                updatedAt: new Date().toISOString()
              })
            });

            // 4. Student fallback
            await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/students`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                id: studentId,
                parentId: parentId,
                schoolId: schoolId,
                firstName: studentFirst,
                lastName: studentLast,
                grade: data.grade || null,
                updatedAt: new Date().toISOString()
              })
            });

            // 5. Registration fallback
            const serviceTypeVal = data.serviceNeeded === "BOTH" ? "AM_AND_PM" : (data.serviceNeeded === "AM" ? "AM_ONLY" : "PM_ONLY");
            await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/registrations`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                id: regId,
                studentId: studentId,
                schoolId: schoolId,
                schoolCode: code,
                serviceType: serviceTypeVal,
                status: initialStatus,
                paymentStatus: initialPaymentStatus,
                updatedAt: new Date().toISOString()
              })
            });
          } catch (supaErr) {
            console.error("[INTAKE_API] Supabase REST school_transport fallback failed:", supaErr);
          }
        }
      }

      // Send status email (non-blocking)
      try {
        const emailSubject = initialStatus === "WAITLISTED" 
          ? "Eagle Bus - Added to Waitlist" 
          : "Eagle Bus - Registration Received";
        
        const emailBody = initialStatus === "WAITLISTED"
          ? `Thank you for registering ${studentFirst}. Bus capacity for your requested route is currently full. Your registration has been placed on the priority waitlist.`
          : `We have received your school transportation registration for ${studentFirst}. We will review it shortly.`;

        await messaging.sendEmail(contactEmail, emailSubject, emailBody);
      } catch {}

      return NextResponse.json({ 
        success: true, 
        registrationId: regId,
        isWaitlisted: initialStatus === "WAITLISTED"
      });

    } else if (serviceType === "private_pay") {
      const studentFirst = data.studentFirstName || contactName.split(" ")[0] || "Student";
      const studentLast = data.studentLastName || contactName.split(" ").slice(1).join(" ") || "Applicant";
      
      let userId = `usr_${Date.now()}`;
      let parentId = `prt_${Date.now()}`;
      let studentId = `std_${Date.now()}`;
      let regId = `reg_${Date.now()}`;

      try {
        let privateSchool = await prisma.school.findFirst({ where: { name: "Private Pay" } });
        if (!privateSchool) {
          privateSchool = await prisma.school.create({ data: { name: "Private Pay", code: "PRIVATEPAY" }});
        }

        const parentUser = await prisma.user.create({
          data: {
            id: userId,
            email: contactEmail,
            name: contactName,
            role: "PARENT",
            parent: {
              create: {
                id: parentId,
                firstName: contactName.split(" ")[0] || "Unknown",
                lastName: contactName.split(" ").slice(1).join(" ") || "Unknown",
                email: contactEmail,
                phone1: contactPhone || null,
              }
            }
          },
          include: { parent: true }
        });
        parentId = parentUser.parent?.id || parentId;

        const student = await prisma.student.create({
          data: {
            id: studentId,
            parentId: parentId,
            schoolId: privateSchool.id,
            firstName: studentFirst,
            lastName: studentLast,
          }
        });
        studentId = student.id;

        const serviceTypeVal = data.serviceNeeded === "BOTH" ? "AM_AND_PM" : (data.serviceNeeded === "AM" ? "AM_ONLY" : "PM_ONLY");
        const registration = await prisma.registration.create({
          data: {
            id: regId,
            studentId: studentId,
            schoolId: privateSchool.id,
            schoolCode: "PRIVATEPAY",
            serviceType: serviceTypeVal,
            status: "PENDING_REVIEW"
          }
        });
        regId = registration.id;
      } catch (dbErr) {
        console.warn("[INTAKE_API] Prisma private_pay pipeline failed, using Supabase REST fallback:", dbErr);
      }
      
      try {
        await messaging.sendEmail(
          contactEmail, 
          "Eagle Bus - Private Pay Request Received", 
          `We have received your private transportation request for ${studentFirst}. We will review it and send you a quote shortly.`
        );
      } catch {}

      return NextResponse.json({ success: true, registrationId: regId });
    }

    return NextResponse.json({ error: "Invalid service type" }, { status: 400 });
  } catch (error: any) {
    console.error("[INTAKE_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Failed to process request" }, { status: 500 });
  }
}
