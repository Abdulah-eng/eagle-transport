import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import CharterTripsClient from "./charter-trips-client"

export default async function AdminCharterTripsPage() {
  const session = await auth()
  if (process.env.NODE_ENV !== "development" && (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
    redirect("/auth/login")
  }

  const charterTrips = await db.charterTrip.findMany({
    include: {
      school: true,
      tripQuote: true,
      assignments: {
        include: {
          driver: true,
          bus: true,
        }
      },
      invoices: true,
    },
    orderBy: { tripDate: "asc" }
  })

  const drivers = await db.driver.findMany({
    where: { isActive: true },
    orderBy: { firstName: "asc" }
  })

  const buses = await db.bus.findMany({
    where: { isActive: true },
    orderBy: { busNumber: "asc" }
  })

  return (
    <CharterTripsClient 
      charterTrips={JSON.parse(JSON.stringify(charterTrips))}
      drivers={JSON.parse(JSON.stringify(drivers))}
      buses={JSON.parse(JSON.stringify(buses))}
    />
  )
}
