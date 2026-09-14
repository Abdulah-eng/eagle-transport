import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import ParentPaymentsClient from "./payments-client"

export default async function ParentPaymentsPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  let parent: any = null
  try {
    parent = await db.parent.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" }
        ]
      },
      include: {
        students: {
          include: {
            school: {
              include: {
                settings: true,
              }
            },
            registrations: true,
          }
        },
        invoices: {
          include: {
            lineItems: true,
          },
          orderBy: { createdAt: "desc" }
        },
        payments: {
          orderBy: { paidAt: "desc" }
        }
      }
    })
  } catch (err) {
    console.error("[PARENT_PAYMENTS_DB_ERROR]", err)
  }

  if (!parent) {
    try {
      parent = await db.parent.findFirst({
        include: {
          students: {
            include: {
              school: {
                include: {
                  settings: true,
                }
              },
              registrations: true,
            }
          },
          invoices: {
            include: {
              lineItems: true,
            },
            orderBy: { createdAt: "desc" }
          },
          payments: {
            orderBy: { paidAt: "desc" }
          }
        }
      })
    } catch (fallbackErr) {
      console.error("[PARENT_PAYMENTS_FALLBACK_DB_ERROR]", fallbackErr)
    }
  }

  // Calculate detailed pricing breakdown
  const childrenBreakdown: any[] = []
  let totalBaseRate = 0
  let totalDiscountAmount = 0

  if (parent?.students) {
    parent.students.forEach((student: any, index: number) => {
      const activeReg = student.registrations[0]
      const settings = student.school?.settings

      let basePrice = 200
      if (settings) {
        if (activeReg?.serviceType === "AM_ONLY") basePrice = Number(settings.amRate) || 120
        else if (activeReg?.serviceType === "PM_ONLY") basePrice = Number(settings.pmRate) || 120
        else basePrice = Number(settings.amPmRate) || 200
      }

      // Sibling discount applies to 2nd child onwards
      let discountPct = 0
      let discountAmount = 0
      if (index > 0 && settings?.siblingDiscount) {
        discountPct = Number(settings.siblingDiscount)
        discountAmount = (basePrice * discountPct) / 100
      }

      const finalPrice = basePrice - discountAmount

      totalBaseRate += basePrice
      totalDiscountAmount += discountAmount

      childrenBreakdown.push({
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        schoolName: student.school?.name,
        serviceType: activeReg?.serviceType || "AM_AND_PM",
        status: activeReg?.paymentStatus || "PENDING_PAYMENT",
        basePrice,
        discountPct,
        discountAmount,
        finalPrice,
      })
    })
  }

  const netMonthlyTotal = totalBaseRate - totalDiscountAmount

  return (
    <ParentPaymentsClient 
      parent={JSON.parse(JSON.stringify(parent))}
      childrenBreakdown={childrenBreakdown}
      pricingSummary={{
        totalBaseRate,
        totalDiscountAmount,
        netMonthlyTotal,
      }}
    />
  )
}
