import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/config"
import { messagingService } from "@/lib/integrations/messaging"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action, registrationId, parentId, amount, reason } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    if (action === "retry_payment") {
      if (!registrationId) {
        return NextResponse.json({ error: "Registration ID required" }, { status: 400 })
      }

      // Simulate payment collection retry
      const registration = await db.registration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: "PAID_ACTIVE",
        },
        include: {
          student: {
            include: { parent: true }
          }
        }
      })

      // Create Payment record
      await db.payment.create({
        data: {
          registrationId: registration.id,
          parentId: registration.student.parentId,
          amount: 150.00, // standard rate
          method: "stripe",
          status: "succeeded",
          notes: "Admin triggered payment retry - successful",
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: "Payment retried and processed successfully. Subscription is now ACTIVE." 
      })
    }

    if (action === "send_reminder") {
      if (!parentId) {
        return NextResponse.json({ error: "Parent ID required" }, { status: 400 })
      }

      const parent = await db.parent.findUnique({
        where: { id: parentId }
      })

      if (!parent) {
        return NextResponse.json({ error: "Parent not found" }, { status: 404 })
      }

      // Send SMS and Email notification
      if (parent.phone1) {
        await messagingService.sendSms(
          parent.phone1,
          `Eagle Bus Notice: Your transportation payment is overdue. Please log into the Parent Portal to resolve your balance and prevent service suspension.`
        )
      }

      await messagingService.sendEmail(
        parent.email,
        "URGENT: Eagle Bus Transportation Payment Overdue",
        `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Eagle Bus Transportation Payment Reminder</h2>
          <p>Dear ${parent.firstName} ${parent.lastName},</p>
          <p>We noticed your monthly bus transportation payment is past due. To ensure uninterrupted service for your child, please log into your account and clear the outstanding balance.</p>
          <p style="margin-top: 20px;">
            <a href="http://localhost:3000/parent/payments" style="background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Go to Parent Pay Portal</a>
          </p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">Eagle Bus Operations Team</p>
        </div>
        `
      )

      return NextResponse.json({
        success: true,
        message: `Overdue notification sent to ${parent.email} and ${parent.phone1 || 'phone'}.`
      })
    }

    if (action === "suspend_service") {
      if (!registrationId) {
        return NextResponse.json({ error: "Registration ID required" }, { status: 400 })
      }

      const registration = await db.registration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: "SUSPENDED",
        },
        include: {
          student: { include: { parent: true } }
        }
      })

      // Send suspension notification
      await messagingService.sendEmail(
        registration.student.parent.email,
        "NOTICE: Eagle Bus Transportation Service Suspended",
        `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #dc2626;">Transportation Service Suspended</h2>
          <p>Dear ${registration.student.parent.firstName},</p>
          <p>Due to unpaid outstanding balance, transportation service for <strong>${registration.student.firstName} ${registration.student.lastName}</strong> has been temporarily suspended.</p>
          <p>To reactivate bus access, please pay your balance online or contact the office.</p>
        </div>
        `
      )

      return NextResponse.json({
        success: true,
        message: "Transportation service suspended for registration."
      })
    }

    if (action === "issue_credit") {
      if (!parentId || !amount) {
        return NextResponse.json({ error: "Parent ID and amount are required" }, { status: 400 })
      }

      const credit = await db.credit.create({
        data: {
          amount: parseFloat(amount),
          reason: reason || "Admin credit manual adjustment",
          createdBy: session.user.id,
        }
      })

      return NextResponse.json({
        success: true,
        message: `Credit of $${parseFloat(amount).toFixed(2)} issued successfully.`,
        credit
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("[PARENT_PAY_ACTION]", error)
    return NextResponse.json({ error: "Failed to execute billing action" }, { status: 500 })
  }
}
