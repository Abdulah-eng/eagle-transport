import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quickbooksService } from "@/lib/integrations/quickbooks";
import { messagingService } from "@/lib/integrations/messaging";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get("tripId");

  if (!tripId) {
    return NextResponse.redirect(new URL("/?error=missing_trip", req.url));
  }

  try {
    const res = await processApproval(tripId);
    if (res.invoiceNumber) {
      return NextResponse.redirect(new URL(`/pay/charter/${res.invoiceNumber}?approved=true`, req.url));
    }
    return NextResponse.redirect(new URL(`/pay/charter/approved?tripId=${tripId}`, req.url));
  } catch (err: any) {
    console.error("[TRIP_APPROVE_GET] Error:", err);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(err.message || "approval_failed")}`, req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { tripId } = body;

    if (!tripId) {
      return NextResponse.json({ error: "tripId is required" }, { status: 400 });
    }

    const result = await processApproval(tripId);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[TRIP_APPROVE_POST] Error:", err);
    return NextResponse.json({ error: err.message || "Approval failed" }, { status: 500 });
  }
}

async function processApproval(tripId: string) {
  // 1. Fetch trip
  let trip: any = null;
  try {
    trip = await db.charterTrip.findUnique({
      where: { id: tripId },
      include: { tripQuote: true }
    });
  } catch {}

  if (!trip && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supaRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?id=eq.${tripId}&select=*,trip_quotes(*)`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      if (supaRes.ok) {
        const rows = await supaRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          trip = rows[0];
        }
      }
    } catch {}
  }

  if (!trip) {
    throw new Error("Charter trip not found");
  }

  // 2. Update status to APPROVED
  try {
    await db.charterTrip.update({
      where: { id: tripId },
      data: { status: "APPROVED" }
    });
  } catch {}

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?id=eq.${tripId}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'APPROVED', updatedAt: new Date().toISOString() })
      });
    } catch {}
  }

  // 3. Find quote amount
  const tripQuoteObj = Array.isArray(trip.tripQuote) ? trip.tripQuote[0] : (trip.trip_quotes?.[0] || trip.tripQuote);
  const rawAmt = tripQuoteObj?.amount ?? trip.quoteAmount ?? trip.estimatedCost;
  const amount = (rawAmt !== undefined && rawAmt !== null && !isNaN(Number(rawAmt)) && Number(rawAmt) > 0) ? Number(rawAmt) : 500.00;

  // 4. Generate or fetch invoice
  let invoice: any = null;
  try {
    invoice = await db.invoice.findFirst({
      where: { charterTripId: tripId }
    });
  } catch {}

  const invNumber = invoice?.invoiceNumber || `INV-CHARTER-${Date.now().toString().slice(-5)}`;

  if (!invoice) {
    let qbInvoiceId: string | null = null;
    try {
      qbInvoiceId = await quickbooksService.createInvoice({
        customerName: trip.billingName || trip.organizationName,
        customerEmail: trip.billingEmail || trip.contactEmail,
        amount,
        description: `Charter Bus Transportation for ${trip.organizationName} on ${new Date(trip.tripDate).toLocaleDateString()}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    } catch {}

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
    };

    try {
      invoice = await db.invoice.create({
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
      });
    } catch {}

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
        });
      } catch {}
    }
  }

  // 5. Send Notification Email to Dispatch & Invoice Email to Customer
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://eaglebusconnect.com").replace(/\/$/, "");
  const payUrl = `${appUrl}/pay/charter/${invNumber}`;

  // Notify Dispatch Team
  try {
    await messagingService.sendEmail(
      process.env.EMAIL_FROM || "billing@eaglebus.com",
      `[QUOTE APPROVED] ${trip.organizationName} has approved their quote ($${amount.toFixed(2)})`,
      `Customer ${trip.contactName} (${trip.organizationName}) has approved quote of $${amount.toFixed(2)}.\nTrip Date: ${new Date(trip.tripDate).toLocaleDateString()}.\nPlease assign driver and bus on Admin Dashboard.`,
      `<div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #15803d;">Quote Approved by Customer!</h2>
        <p><strong>Organization:</strong> ${trip.organizationName}</p>
        <p><strong>Contact:</strong> ${trip.contactName} (${trip.contactEmail})</p>
        <p><strong>Trip Date:</strong> ${new Date(trip.tripDate).toLocaleDateString()}</p>
        <p><strong>Quoted Amount:</strong> $${amount.toFixed(2)}</p>
        <p><strong>Invoice Number:</strong> ${invNumber}</p>
        <p style="margin-top: 15px;"><a href="${appUrl}/admin/charter-trips" style="background: #15803d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Admin Dashboard to Assign Driver & Bus</a></p>
      </div>`
    );
  } catch {}

  // Send Invoice Email with direct Stripe pay link to Customer
  try {
    const billingEmail = trip.billingEmail || trip.contactEmail;
    const billingName = trip.billingName || trip.organizationName;

    const htmlInvoiceEmail = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #15803d 0%, #2ca01c 100%); color: white; padding: 28px 24px; text-align: left;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; font-weight: 700; margin-bottom: 4px;">Eagle Bus Transportation</div>
          <h2 style="margin: 0; font-size: 24px; font-weight: 800;">Charter Invoice Ready</h2>
        </div>
        
        <div style="padding: 28px 24px; background: #ffffff; color: #1e293b;">
          <p style="font-size: 16px; margin-top: 0; color: #0f172a;">Dear <strong>${billingName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">Thank you for approving your quote! An official invoice has been generated for your upcoming charter transportation trip for <strong>${trip.organizationName}</strong>.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 12px; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Invoice #</td>
                <td style="font-size: 12px; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; text-align: right;">Organization</td>
              </tr>
              <tr>
                <td style="font-size: 18px; font-weight: 800; color: #166534; padding-top: 2px;">${invNumber}</td>
                <td style="font-size: 15px; font-weight: 700; color: #1e293b; text-align: right; padding-top: 2px;">${trip.organizationName}</td>
              </tr>
            </table>
            
            <hr style="border: 0; border-top: 1px dashed #86efac; margin: 16px 0;" />
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 13px; color: #15803d; font-weight: 600;">Total Amount Due</td>
                <td style="font-size: 26px; font-weight: 900; color: #166534; text-align: right;">$${amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="font-size: 12px; color: #64748b; padding-top: 4px;">Terms</td>
                <td style="font-size: 12px; font-weight: 700; color: #b45309; text-align: right; padding-top: 4px;">Due within 7 days</td>
              </tr>
            </table>
          </div>

          <!-- Direct Payment Button -->
          <div style="margin: 28px 0; text-align: center;">
            <a href="${payUrl}" style="display: inline-block; background: #2ca01c; color: #ffffff; font-weight: 700; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-size: 16px; box-shadow: 0 4px 12px rgba(44,160,28,0.3);">
              💳 Pay Invoice Online ($${amount.toFixed(2)})
            </a>
          </div>

          <div style="background: #f8fafc; border-left: 4px solid #2ca01c; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
              <strong>Fast Online Payment:</strong> Click the green button above to view your full invoice statement and pay instantly using Credit Card, Debit, or Apple Pay with zero login required.
            </p>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">If you have any questions regarding this invoice, please reach out to our billing team at <a href="mailto:billing@eaglebus.com" style="color: #15803d; font-weight: 600; text-decoration: none;">billing@eaglebus.com</a>.</p>
          
          <div style="margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 18px; text-align: center;">
            Eagle Bus Transportation • <a href="${appUrl}" style="color: #64748b; text-decoration: none;">theeaglebus.com</a>
          </div>
        </div>
      </div>`;

    await messagingService.sendEmail(
      billingEmail,
      `Invoice Ready — ${trip.organizationName} Charter Trip (${invNumber})`,
      `Dear ${billingName},\n\nYour invoice ${invNumber} for $${amount.toFixed(2)} is ready for the ${trip.organizationName} charter trip.\n\nPay Online Now: ${payUrl}\n\nThank you for choosing Eagle Bus!`,
      htmlInvoiceEmail
    );
  } catch {}

  return { trip, invoiceNumber: invNumber, amount };
}
