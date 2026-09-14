import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import ReportsClient from "./reports-client"

export default async function AdminReportsPage() {
  const session = await auth()
  if (process.env.NODE_ENV !== "development" && (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
    redirect("/auth/login")
  }

  let invoices: any[] = []
  let students: any[] = []
  let routes: any[] = []
  let drivers: any[] = []
  let incidents: any[] = []

  try {
    invoices = await db.invoice.findMany({
      include: { school: true, parent: true },
      orderBy: { createdAt: "desc" }
    })

    students = await db.student.findMany({
      include: { school: true, registrations: true },
    })

    routes = await db.route.findMany({
      include: { school: true, runs: { include: { stops: true } } }
    })

    drivers = await db.driver.findMany({
      include: { assignments: true }
    })

    incidents = await db.incident.findMany({
      include: { student: true, school: true, driver: true },
      orderBy: { date: "desc" }
    })
  } catch (err) {
    console.error("[ADMIN_REPORTS_DB_ERROR]", err)
  }

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
