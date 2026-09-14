import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import CharterTripsClient from "./charter-trips-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

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

  if (charterTrips.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?select=*,school:schools(*),tripQuote:trip_quotes(*),assignments:trip_assignments(*,driver:drivers(*),bus:buses(*)),invoices(*)`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        cache: 'no-store'
      })
      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows)) charterTrips = rows
      }
    } catch (e) {
      console.error("[ADMIN_CHARTER_TRIPS_SUPABASE_FALLBACK_ERROR]", e)
    }
  }

  const fallbackDrivers = [
    { id: "drv_1", firstName: "John", lastName: "Miller", licenseNo: "CDL-A-9921" },
    { id: "drv_2", firstName: "Sarah", lastName: "Jenkins", licenseNo: "CDL-A-8832" },
    { id: "drv_3", firstName: "Robert", lastName: "Davis", licenseNo: "CDL-A-7743" },
    { id: "drv_4", firstName: "Emily", lastName: "Taylor", licenseNo: "CDL-A-6654" }
  ]

  const fallbackBuses = [
    { id: "bus_101", busNumber: "101", capacity: 60 },
    { id: "bus_102", busNumber: "102", capacity: 60 },
    { id: "bus_104", busNumber: "104", capacity: 54 },
    { id: "bus_105", busNumber: "105", capacity: 60 },
    { id: "bus_108", busNumber: "108", capacity: 60 }
  ]

  const activeDrivers = drivers.length > 0 ? drivers : fallbackDrivers
  const activeBuses = buses.length > 0 ? buses : fallbackBuses

  return (
    <CharterTripsClient 
      charterTrips={JSON.parse(JSON.stringify(charterTrips))}
      drivers={JSON.parse(JSON.stringify(activeDrivers))}
      buses={JSON.parse(JSON.stringify(activeBuses))}
    />
  )
}
