import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/config"

export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const schools = await db.school.findMany({
      include: {
        settings: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(schools)
  } catch (error) {
    console.error("[SCHOOL_RATES_GET]", error)
    return NextResponse.json({ error: "Failed to fetch school rates" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { schoolId, amRate, pmRate, amPmRate, siblingDiscount } = body

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    const updatedSettings = await db.schoolSettings.upsert({
      where: { schoolId },
      update: {
        amRate: parseFloat(amRate) || 0,
        pmRate: parseFloat(pmRate) || 0,
        amPmRate: parseFloat(amPmRate) || 0,
        siblingDiscount: parseFloat(siblingDiscount) || 0,
      },
      create: {
        schoolId,
        amRate: parseFloat(amRate) || 0,
        pmRate: parseFloat(pmRate) || 0,
        amPmRate: parseFloat(amPmRate) || 0,
        siblingDiscount: parseFloat(siblingDiscount) || 0,
      },
    })

    return NextResponse.json({ success: true, settings: updatedSettings })
  } catch (error) {
    console.error("[SCHOOL_RATES_POST]", error)
    return NextResponse.json({ error: "Failed to update school rates" }, { status: 500 })
  }
}
