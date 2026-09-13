import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const { type, data } = payload

    console.log(`[Resend Webhook Event]: ${type}`, {
      emailId: data?.email_id,
      to: data?.to,
      subject: data?.subject,
      created_at: data?.created_at,
    })

    // Handle specific event types if needed
    switch (type) {
      case "email.sent":
        console.log(`[Resend] Email sent to ${data?.to?.join(", ")}`)
        break
      case "email.delivered":
        console.log(`[Resend] Email delivered to ${data?.to?.join(", ")}`)
        break
      case "email.bounced":
        console.warn(`[Resend Warning] Email bounced for ${data?.to?.join(", ")}:`, data?.bounce)
        break
      case "email.complained":
        console.warn(`[Resend Warning] Spam complaint from ${data?.to?.join(", ")}`)
        break
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[RESEND_WEBHOOK_ERROR]", error)
    return NextResponse.json({ error: "Webhook process failed" }, { status: 400 })
  }
}
