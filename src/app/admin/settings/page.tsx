import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import SettingsClient from "./settings-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

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

  if (integrations.length === 0 && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/integrations?select=*`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        cache: 'no-store'
      })
      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows)) integrations = rows
      }
    } catch (e) {
      console.error("[ADMIN_SETTINGS_SUPABASE_FALLBACK_ERROR]", e)
    }
  }

  return (
    <SettingsClient 
      envCheck={envCheck}
      integrations={JSON.parse(JSON.stringify(integrations))}
    />
  )
}
