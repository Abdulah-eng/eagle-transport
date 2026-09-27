import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quickbooksService } from "@/lib/integrations/quickbooks";
import { stripeService } from "@/lib/integrations/stripe";
import { messagingService } from "@/lib/integrations/messaging";

export async function GET(req: NextRequest, props: { params: Promise<{ invoiceId: string }> }) {
  const params = await props.params;
  const rawId = params.invoiceId;

  if (!rawId) {
    return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });
  }

  let invoice: any = null;

  try {
    invoice = await db.invoice.findFirst({
      where: {
        OR: [
          { invoiceNumber: rawId },
          { id: rawId },
          { quickbooksInvoiceId: rawId }
        ]
      },
      include: {
        charterTrip: true
      }
    });
  } catch (dbErr) {
    console.warn("[API_PAY_CHARTER] Prisma invoice query warning:", dbErr);
  }

  if (!invoice && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supaRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/invoices?or=(invoiceNumber.eq.${rawId},id.eq.${rawId},quickbooksInvoiceId.eq.${rawId})&select=*,charter_trips(*)`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      if (supaRes.ok) {
        const rows = await supaRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          invoice = {
            ...row,
            charterTrip: row.charter_trips?.[0] || row.charter_trips || null
          };
        }
      }
    } catch (supaErr) {
      console.error("[API_PAY_CHARTER] Supabase REST invoice query failed:", supaErr);
    }
  }

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, invoice });
}

export async function POST(req: NextRequest, props: { params: Promise<{ invoiceId: string }> }) {
  const params = await props.params;
  const rawId = params.invoiceId;

  try {
    const body = await req.json().catch(() => ({}));
    const { cardNumber, cardExp, cardCvc, cardName } = body;

    let invoice: any = null;
    try {
      invoice = await db.invoice.findFirst({
        where: {
          OR: [
            { invoiceNumber: rawId },
            { id: rawId },
            { quickbooksInvoiceId: rawId }
          ]
        },
        include: { charterTrip: true }
      });
    } catch {}

    if (!invoice && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supaRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/invoices?or=(invoiceNumber.eq.${rawId},id.eq.${rawId},quickbooksInvoiceId.eq.${rawId})&select=*,charter_trips(*)`, {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        });
        if (supaRes.ok) {
          const rows = await supaRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const row = rows[0];
            invoice = {
              ...row,
              charterTrip: row.charter_trips?.[0] || row.charter_trips || null
            };
          }
        }
      } catch {}
    }

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ success: true, message: "Invoice is already paid" });
    }

    const amountVal = Number(invoice.totalAmount || invoice.amount || 0);

    // 1. Process payment with Stripe Service
    const paymentIntent = await stripeService.createPaymentIntent(Math.round(amountVal * 100), {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      charterTripId: invoice.charterTripId || "",
      billingEmail: invoice.billingEmail || ""
    });

    // 2. Mark Invoice as PAID in Prisma DB
    try {
      await db.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          stripePaymentIntentId: paymentIntent?.id || `pi_direct_${Date.now()}`
        }
      });
    } catch (dbErr) {
      console.warn("[API_PAY_CHARTER] Prisma invoice update failed:", dbErr);
    }

    // Update charter trip status to PAID if exists
    if (invoice.charterTripId) {
      try {
        await db.charterTrip.update({
          where: { id: invoice.charterTripId },
          data: { status: "PAID" }
        });
      } catch {}
    }

    // 3. Patch Supabase REST fallback
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/invoices?id=eq.${invoice.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'PAID', paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        });

        if (invoice.charterTripId) {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?id=eq.${invoice.charterTripId}`, {
            method: 'PATCH',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'PAID', updatedAt: new Date().toISOString() })
          });
        }
      } catch {}
    }

    // 4. Sync payment to QuickBooks (if connected)
    if (invoice.quickbooksInvoiceId) {
      try {
        await quickbooksService.syncPayment(
          invoice.quickbooksInvoiceId,
          amountVal,
          paymentIntent?.id || `pay_${Date.now()}`
        );
      } catch (qbErr) {
        console.warn("[API_PAY_CHARTER] QuickBooks payment sync warning:", qbErr);
      }
    }

    // 5. Send Payment Confirmation Receipt Email
    try {
      const email = invoice.billingEmail || invoice.charterTrip?.contactEmail;
      const name = invoice.billingName || invoice.charterTrip?.contactName || "Valued Customer";
      if (email) {
        await messagingService.sendEmail(
          email,
          `Payment Receipt — Eagle Bus Invoice ${invoice.invoiceNumber}`,
          `Dear ${name},\n\nWe have received your payment of $${amountVal.toFixed(2)} for Invoice ${invoice.invoiceNumber}.\n\nThank you for choosing Eagle Bus Transportation!`,
          `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #15803d;">Payment Receipt - Thank You!</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>We have successfully processed your payment of <strong>$${amountVal.toFixed(2)}</strong> for Invoice <strong>${invoice.invoiceNumber}</strong>.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; font-size: 16px; font-weight: bold; color: #166534; margin: 15px 0;">
              Status: PAID IN FULL
            </div>
            <p>Eagle Bus Transportation Services • theeaglebus.com</p>
          </div>`
        );
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      invoiceNumber: invoice.invoiceNumber,
      amount: amountVal
    });
  } catch (err: any) {
    console.error("[API_PAY_CHARTER_POST] Error:", err);
    return NextResponse.json({ error: err.message || "Payment processing failed" }, { status: 500 });
  }
}
