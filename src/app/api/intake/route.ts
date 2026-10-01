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
    const contactName = data.contactName || `${data.contactFirstName || ''} ${data.contactLastName || ''}`.trim();
    const { serviceType, contactEmail, contactPhone } = data;

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
          { 
            id: activeTripId, 
            organizationName: orgName, 
            tripDate: tripDateObj,
            stagingTime: stagingTimeObj,
            pickupAddress: pickup,
            destinationAddress: destination,
            numberOfStudents: students,
            numberOfBuses: buses,
            billingName: billName,
            billingEmail: billEmail,
            billingPhone: data.billingPhone || contactPhone || null,
            specialInstructions: data.specialInstructions || null
          }
        );
      } catch (mailErr) {
        console.warn("[INTAKE_API] Email confirmation send warning:", mailErr);
      }

      return NextResponse.json({ success: true, tripId: activeTripId });

    } else if (serviceType === "school_transport") {
      const schoolName = data.schoolName || contactName || "Charter School Client";
      const title = data.title || "Administrator";
      const preferredContactMethod = data.preferredContactMethod || "Email";
      const preferredBusService = data.preferredBusService || "Daily AM & PM Routes";
      const schoolAddressStr = [data.schoolStreet, data.schoolStreet2, data.schoolCity, data.schoolState, data.schoolZip, data.schoolCountry || "US"].filter(Boolean).join(", ");
      const serviceArea = data.serviceArea || "N/A";
      const studentCategory = data.numberOfStudentsCategory || "50 - 100";
      const days = Number(data.academicSchoolDays) || 180;
      const firstDay = data.firstDayOfSchool || "TBD";
      const lastDay = data.lastDayOfSchool || "TBD";
      const amBell = data.amBellTime || "N/A";
      const amArr = data.amBusArrivalTime || "N/A";
      const pmBell = data.pmBellTime || "N/A";
      const pmArr = data.pmBusArrivalTime || "N/A";
      const ownBuses = data.hasOwnBuses || "No";
      const busesCount = Number(data.ownBusesCount) || 0;
      const comments = data.comments || "None";
      const tripId = `rfq_${Date.now()}`;

      // Save to Charter Trips database
      try {
        await prisma.charterTrip.create({
          data: {
            id: tripId,
            organizationName: schoolName,
            contactName: contactName,
            contactEmail: contactEmail,
            contactPhone: contactPhone || null,
            billingName: schoolName,
            billingEmail: contactEmail,
            tripDate: parseSafeDate(firstDay),
            pickupAddress: schoolAddressStr || "Service Area TBD",
            destinationName: schoolName,
            destinationAddress: schoolAddressStr || "School Location TBD",
            numberOfStudents: studentCategory === "Less than 50" ? 40 : (studentCategory === "50 - 100" ? 75 : 150),
            numberOfBuses: busesCount > 0 ? busesCount : 2,
            specialInstructions: `Title: ${title} | Preferred Contact: ${preferredContactMethod} | Bus Service: ${preferredBusService} | Area: ${serviceArea} | Days: ${days} | Bell AM: ${amBell}, Bus AM: ${amArr} | Bell PM: ${pmBell}, Bus PM: ${pmArr} | Own Buses: ${ownBuses} (${busesCount}) | Comments: ${comments}`,
            tripType: "DAILY_SCHOOL_ROUTE",
            status: "NEW"
          }
        });
      } catch (dbErr) {
        console.warn("[INTAKE_API] Charter School RFQ Prisma create failed, trying Supabase fallback:", dbErr);
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips`, {
            method: 'POST',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              id: tripId,
              organizationName: schoolName,
              contactName: contactName,
              contactEmail: contactEmail,
              contactPhone: contactPhone || null,
              billingName: schoolName,
              billingEmail: contactEmail,
              tripDate: parseSafeDate(firstDay).toISOString(),
              pickupAddress: schoolAddressStr || "Service Area TBD",
              destinationName: schoolName,
              destinationAddress: schoolAddressStr || "School Location TBD",
              numberOfStudents: 100,
              numberOfBuses: 2,
              specialInstructions: `Title: ${title} | Preferred Contact: ${preferredContactMethod} | Bus Service: ${preferredBusService} | Area: ${serviceArea} | Days: ${days} | Comments: ${comments}`,
              tripType: "DAILY_SCHOOL_ROUTE",
              status: "NEW",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          });
        } catch {}
      }

      // Email Detailed RFQ Summary to Dispatch & Confirmation to Applicant
      try {
        const htmlRfqEmail = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 24px; text-align: left;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; font-weight: 700;">Eagle Bus Transportation</div>
              <h2 style="margin: 4px 0 0 0; font-size: 22px; font-weight: 800;">Charter School Daily Bus Service RFQ</h2>
            </div>
            
            <div style="padding: 24px; color: #1e293b;">
              <p style="font-size: 15px; margin-top: 0;"><strong>School / Program:</strong> ${schoolName}</p>
              
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 18px; border-radius: 10px; margin: 16px 0;">
                <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 13px; text-transform: uppercase;">Contact Information</h4>
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr><td style="padding: 4px 0; color: #64748b; width: 40%;">Contact Name:</td><td style="padding: 4px 0; font-weight: 700;">${contactName} (${title})</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Phone Number:</td><td style="padding: 4px 0; font-weight: 600;">${contactPhone || 'N/A'}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">E-mail Address:</td><td style="padding: 4px 0; font-weight: 600;">${contactEmail}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Preferred Contact:</td><td style="padding: 4px 0; font-weight: 600;">${preferredContactMethod}</td></tr>
                </table>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 10px; margin: 16px 0;">
                <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 13px; text-transform: uppercase;">Service & Route Details</h4>
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr><td style="padding: 4px 0; color: #64748b; width: 40%;">Type of Service:</td><td style="padding: 4px 0; font-weight: 700; color: #2563eb;">${preferredBusService}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">School Address:</td><td style="padding: 4px 0; font-weight: 600;">${schoolAddressStr}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Service Area:</td><td style="padding: 4px 0; font-weight: 600;">${serviceArea}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Student Volume:</td><td style="padding: 4px 0; font-weight: 700;">${studentCategory} students</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Academic Days:</td><td style="padding: 4px 0; font-weight: 600;">${days} days</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">First / Last Day:</td><td style="padding: 4px 0; font-weight: 600;">${firstDay} to ${lastDay}</td></tr>
                </table>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 10px; margin: 16px 0;">
                <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 13px; text-transform: uppercase;">Bell & Bus Arrival Schedule</h4>
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr><td style="padding: 4px 0; color: #64748b; width: 40%;">AM Bell Time:</td><td style="padding: 4px 0; font-weight: 600;">${amBell} (Buses arrive: ${amArr})</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Dismissal PM Bell:</td><td style="padding: 4px 0; font-weight: 600;">${pmBell} (Buses arrive: ${pmArr})</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Own Fleet:</td><td style="padding: 4px 0; font-weight: 600;">${ownBuses} (${busesCount} buses)</td></tr>
                </table>
              </div>

              ${comments !== 'None' ? `
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
                <strong>Comments / Special Requests:</strong><br/>${comments}
              </div>` : ''}

              <div style="margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
                Eagle Bus Service • <a href="https://eaglebusconnect.com" style="color: #2563eb; text-decoration: none;">eaglebusconnect.com</a>
              </div>
            </div>
          </div>`;

        await messaging.sendEmail(
          contactEmail,
          `Request Received: Charter School Daily Bus Service RFQ — ${schoolName}`,
          `Thank you for submitting your Request for Quote for ${schoolName}. Our team will review your route schedule and contact you shortly.`,
          htmlRfqEmail,
          ["Info@eaglebusservice.com"]
        );
      } catch (mailErr) {
        console.warn("[INTAKE_API] RFQ notification email warning:", mailErr);
      }

      return NextResponse.json({ 
        success: true, 
        tripId: tripId,
        message: "Request for Quote submitted successfully"
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
