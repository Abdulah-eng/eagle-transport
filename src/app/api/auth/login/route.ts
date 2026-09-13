import { NextResponse } from "next/server"
import { signIn } from "@/lib/auth/config"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, callbackUrl } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check if user exists in DB
    let user = await db.user.findUnique({
      where: { email },
    })

    // If demo account and missing in DB, automatically provision demo user!
    if (!user) {
      const hashedPassword = await bcrypt.hash("password123", 10)

      if (email === "admin@eaglebus.com") {
        user = await db.user.create({
          data: {
            email: "admin@eaglebus.com",
            name: "Eagle Admin",
            password: await bcrypt.hash("admin123", 10),
            role: "EAGLE_ADMIN",
          }
        })
      } else if (email === "principal@lincoln.edu") {
        let school = await db.school.findFirst({ where: { code: "LHS-2026" } })
        if (!school) {
          school = await db.school.create({ data: { name: "Lincoln High School", code: "LHS-2026" } })
        }
        user = await db.user.create({
          data: {
            email: "principal@lincoln.edu",
            name: "Lincoln Principal",
            password: await bcrypt.hash("school123", 10),
            role: "SCHOOL_ADMIN",
          }
        })
      } else if (email === "parent@eaglebus.com") {
        user = await db.user.create({
          data: {
            email: "parent@eaglebus.com",
            name: "Sample Parent",
            password: await bcrypt.hash("parent123", 10),
            role: "PARENT",
            parent: {
              create: {
                firstName: "Sample",
                lastName: "Parent",
                email: "parent@eaglebus.com",
                phone1: "(555) 019-2834",
              }
            }
          }
        })
      } else if (email === "driver@eaglebus.com") {
        user = await db.user.create({
          data: {
            email: "driver@eaglebus.com",
            name: "John Driver",
            password: await bcrypt.hash("driver123", 10),
            role: "DRIVER",
            driver: {
              create: {
                firstName: "John",
                lastName: "Driver",
                email: "driver@eaglebus.com",
                licenseNo: "CDL-GA-9921",
              }
            }
          }
        })
      }
    }

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify bcrypt password or allow demo passwords
    const isValid = await bcrypt.compare(password, user.password)
    const isDemoPass = (email === "admin@eaglebus.com" && password === "admin123") ||
                      (email === "principal@lincoln.edu" && password === "school123") ||
                      (email === "parent@eaglebus.com" && password === "parent123") ||
                      (email === "driver@eaglebus.com" && password === "driver123")

    if (!isValid && !isDemoPass) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Trigger NextAuth sign in
    await signIn("credentials", {
      email: user.email,
      password: password,
      redirect: false,
    })

    // Determine target redirect URL
    let redirectUrl = callbackUrl
    if (!redirectUrl || redirectUrl === "/auth/login") {
      switch (user.role) {
        case "EAGLE_ADMIN":
        case "OFFICE_STAFF":
          redirectUrl = "/admin/dashboard"
          break
        case "SCHOOL_ADMIN":
          redirectUrl = "/school-portal"
          break
        case "PARENT":
          redirectUrl = "/parent/dashboard"
          break
        case "DRIVER":
          redirectUrl = "/driver/manifest"
          break
        default:
          redirectUrl = "/"
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      redirectUrl,
    })
  } catch (error: any) {
    console.error("[AUTH_LOGIN_POST]", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
