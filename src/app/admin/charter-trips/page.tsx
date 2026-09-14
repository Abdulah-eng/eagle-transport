import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import CharterTripsClient from "./charter-trips-client"

export default async function AdminCharterTripsPage() {
  const session = await auth()
  if (process.env.NODE_ENV !== "development" && (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
    redirect("/auth/login")
  }

  let charterTrips: any[] = []
  let drivers: any[] = []
  let buses: any[] = []

  try {
    charterTrips = await db.charterTrip.findMany({
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

    drivers = await db.driver.findMany({
      where: { isActive: true },
      orderBy: { firstName: "asc" }
    })

    buses = await db.bus.findMany({
      where: { isActive: true },
      orderBy: { busNumber: "asc" }
    })
  } catch (err) {
    console.error("[ADMIN_CHARTER_TRIPS_DB_ERROR]", err)
  }

  return (
    <CharterTripsClient 
      charterTrips={JSON.parse(JSON.stringify(charterTrips))}
      drivers={JSON.parse(JSON.stringify(drivers))}
      buses={JSON.parse(JSON.stringify(buses))}
    />
  )
}
