import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import SettingsClient from "./settings-client"

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
    redirect("/auth/login")
  }

  // Check env presence
  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    QUICKBOOKS_CLIENT_ID: !!process.env.QUICKBOOKS_CLIENT_ID,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  }

  let integrations: any[] = []
  try {
    integrations = await db.integration.findMany()
  } catch (err) {
    console.error("[ADMIN_SETTINGS_DB_ERROR]", err)
  }

  return (
    <SettingsClient 
      envCheck={envCheck}
      integrations={JSON.parse(JSON.stringify(integrations))}
    />
  )
}
