import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { stripeService } from "@/lib/integrations/stripe"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { amount, invoiceId, registrationId } = body

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 })
    }

    // Find parent record
    const parent = await db.parent.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" }
        ]
      }
    })

    const parentEmail = parent?.email || session.user.email || "parent@example.com"
    const parentName = parent ? `${parent.firstName} ${parent.lastName}` : (session.user.name || "Parent")

    // Create or retrieve Stripe customer ID
    let stripeCustomerId = parent?.stripeCustomerId
    if (!stripeCustomerId) {
      stripeCustomerId = await stripeService.createCustomer(parentEmail, parentName) || undefined
      if (stripeCustomerId && parent) {
        await db.parent.update({
          where: { id: parent.id },
          data: { stripeCustomerId }
        })
      }
    }

    // Create PaymentIntent
    const amountInCents = Math.round(parseFloat(amount) * 100)
    const paymentIntent = await stripeService.createPaymentIntent(amountInCents, {
      parentId: parent?.id || "",
      invoiceId: invoiceId || "",
      registrationId: registrationId || "",
      parentEmail,
    })

    if (!paymentIntent) {
      return NextResponse.json({ error: "Failed to initialize payment gateway" }, { status: 500 })
    }

    // Record pending payment in DB if invoiceId or registrationId provided
    if (invoiceId) {
      await db.invoice.update({
        where: { id: invoiceId },
        data: { stripePaymentIntentId: paymentIntent.id }
      })
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      mock: paymentIntent.id.startsWith("pi_mock_"),
    })
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
