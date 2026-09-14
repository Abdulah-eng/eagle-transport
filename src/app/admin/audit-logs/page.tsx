import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import AuditLogsClient from "./audit-logs-client"

export default async function AdminAuditLogsPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
    redirect("/auth/login")
  }

  let logs: any[] = []
  try {
    logs = await db.auditLog.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  } catch (err) {
    console.error("[ADMIN_AUDIT_LOGS_DB_ERROR]", err)
  }

  return (
    <AuditLogsClient logs={JSON.parse(JSON.stringify(logs))} />
  )
}
