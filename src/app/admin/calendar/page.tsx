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

  if (charterTrips.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/charter_trips?select=*,assignments:trip_assignments(*,driver:drivers(*),bus:buses(*))`, {
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
      console.error("[ADMIN_CALENDAR_SUPABASE_CHARTER_FALLBACK_ERROR]", e)
    }
  }

  if (routes.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/routes?select=*,school:schools(*),runs(*,stops(*),driverAssignment:driver_assignments(*,driver:drivers(*),bus:buses(*)))`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        cache: 'no-store'
      })
      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows)) routes = rows
      }
    } catch (e) {
      console.error("[ADMIN_CALENDAR_SUPABASE_ROUTES_FALLBACK_ERROR]", e)
    }
  }

  return (
    <OperationsCalendarClient 
      charterTrips={JSON.parse(JSON.stringify(charterTrips))}
      routes={JSON.parse(JSON.stringify(routes))}
    />
  )
}
