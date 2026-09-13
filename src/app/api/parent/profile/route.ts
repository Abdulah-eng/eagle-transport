import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, phone1, phone2, address, city, state, zipCode } = body

    // Find parent by userId or email
    const parent = await db.parent.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" }
        ]
      }
    })

    if (!parent) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 })
    }

    const updatedParent = await db.parent.update({
      where: { id: parent.id },
      data: {
        firstName,
        lastName,
        phone1,
        phone2,
        address,
        city,
        state,
        zipCode,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Parent profile updated successfully",
      parent: updatedParent,
    })
  } catch (error) {
    console.error("[PARENT_PROFILE_POST]", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
