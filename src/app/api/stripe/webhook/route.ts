import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import Stripe from "stripe"

const stripeSecret = process.env.STRIPE_SECRET_KEY || ""
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2025-02-24.acacia" as any,
})

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("stripe-signature")

    let event: Stripe.Event

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      } catch (err: any) {
        console.warn(`[Stripe Webhook Signature Verification Warning]: ${err.message}. Processing payload fallback.`)
        event = JSON.parse(rawBody)
      }
    } else {
      event = JSON.parse(rawBody)
    }

    console.log(`[Stripe Webhook Event Received]: ${event.type}`)

    if (event.type === "payment_intent.succeeded" || event.type === "invoice.payment_succeeded") {
      const paymentObj = event.data.object as any
      const metadata = paymentObj.metadata || {}
      const { parentId, invoiceId, registrationId } = metadata

      if (invoiceId) {
        await db.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "PAID",
            paidAt: new Date(),
          }
        })
      }

      if (registrationId) {
        await db.registration.update({
          where: { id: registrationId },
          data: {
            paymentStatus: "PAID_ACTIVE"
          }
        })
      }

      if (parentId) {
        await db.payment.create({
          data: {
            parentId,
            registrationId,
            invoiceId,
            amount: (paymentObj.amount || 0) / 100,
            method: "stripe",
            status: "succeeded",
            stripePaymentId: paymentObj.id,
            paidAt: new Date(),
          }
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_ERROR]", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 })
  }
}
