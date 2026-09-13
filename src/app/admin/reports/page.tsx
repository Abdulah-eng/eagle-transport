import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import ReportsClient from "./reports-client"

export default async function AdminReportsPage() {
  const session = await auth()
  if (process.env.NODE_ENV !== "development" && (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
    redirect("/auth/login")
  }

  const invoices = await db.invoice.findMany({
    include: { school: true, parent: true },
    orderBy: { createdAt: "desc" }
  })

  const students = await db.student.findMany({
    include: { school: true, registrations: true },
  })

  const routes = await db.route.findMany({
    include: { school: true, runs: { include: { stops: true } } }
  })

  const drivers = await db.driver.findMany({
    include: { assignments: true }
  })

  const incidents = await db.incident.findMany({
    include: { student: true, school: true, driver: true },
    orderBy: { date: "desc" }
  })

  return (
    <ReportsClient 
      invoices={JSON.parse(JSON.stringify(invoices))}
      students={JSON.parse(JSON.stringify(students))}
      routes={JSON.parse(JSON.stringify(routes))}
      drivers={JSON.parse(JSON.stringify(drivers))}
      incidents={JSON.parse(JSON.stringify(incidents))}
    />
  )
}
