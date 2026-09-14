import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import OperationsCalendarClient from "./calendar-client"

export default async function AdminCalendarPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
    redirect("/auth/login")
  }

  let charterTrips: any[] = []
  let routes: any[] = []

  try {
    charterTrips = await db.charterTrip.findMany({
      include: {
        assignments: {
          include: {
            driver: true,
            bus: true,
          }
        }
      },
      orderBy: { tripDate: "asc" }
    })

    routes = await db.route.findMany({
      include: {
        school: true,
        runs: {
          include: {
            stops: true,
            driverAssignment: {
              include: {
                driver: true,
                bus: true,
              }
            }
          }
        }
      }
    })
  } catch (err) {
    console.error("[ADMIN_CALENDAR_DB_ERROR]", err)
  }

  return (
    <OperationsCalendarClient 
      charterTrips={JSON.parse(JSON.stringify(charterTrips))}
      routes={JSON.parse(JSON.stringify(routes))}
    />
  )
}
