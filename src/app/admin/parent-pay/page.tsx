import { db } from "@/lib/db"
import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import ParentPayAdminClient from "./parent-pay-client"

export default async function AdminParentPayPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
    redirect("/auth/login")
  }

  // Fetch registrations with student, parent, school, invoices, payments
  const registrations = await db.registration.findMany({
    include: {
      student: {
        include: {
          parent: true,
        }
      },
      school: {
        include: {
          settings: true,
        }
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 3,
      }
    },
    orderBy: { submittedAt: "desc" }
  })

  // Fetch schools with settings for rate config
  const schools = await db.school.findMany({
    include: {
      settings: true,
    },
    orderBy: { name: "asc" }
  })

  // Fetch all recent credits
  const credits = await db.credit.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  // Calculate metrics
  let totalMRR = 0
  let activeCount = 0
  let pastDueCount = 0
  let suspendedCount = 0

  registrations.forEach((reg) => {
    if (reg.paymentStatus === "PAID_ACTIVE") activeCount++
    if (reg.paymentStatus === "PAST_DUE") pastDueCount++
    if (reg.paymentStatus === "SUSPENDED") suspendedCount++

    // Monthly rate calculation based on school settings
    const settings = reg.school.settings
    let rate = 0
    if (settings) {
      if (reg.serviceType === "AM_ONLY") rate = Number(settings.amRate) || 120
      else if (reg.serviceType === "PM_ONLY") rate = Number(settings.pmRate) || 120
      else rate = Number(settings.amPmRate) || 200
    } else {
      rate = reg.serviceType === "AM_AND_PM" ? 200 : 120
    }

    if (reg.paymentStatus === "PAID_ACTIVE") {
      totalMRR += rate
    }
  })

  return (
    <ParentPayAdminClient 
      registrations={JSON.parse(JSON.stringify(registrations))}
      schools={JSON.parse(JSON.stringify(schools))}
      credits={JSON.parse(JSON.stringify(credits))}
      stats={{
        totalMRR,
        activeCount,
        pastDueCount,
        suspendedCount,
        totalRegistrations: registrations.length,
      }}
    />
  )
}
