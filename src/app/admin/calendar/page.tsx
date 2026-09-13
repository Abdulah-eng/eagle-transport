import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import OperationsCalendarClient from "./calendar-client"

export default async function AdminCalendarPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
    redirect("/auth/login")
  }

  const charterTrips = await db.charterTrip.findMany({
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

  const routes = await db.route.findMany({
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

  return (
    <OperationsCalendarClient 
      charterTrips={JSON.parse(JSON.stringify(charterTrips))}
      routes={JSON.parse(JSON.stringify(routes))}
    />
  )
}
