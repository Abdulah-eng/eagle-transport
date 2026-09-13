import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import AuditLogsClient from "./audit-logs-client"

export default async function AdminAuditLogsPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF")) {
    redirect("/auth/login")
  }

  const logs = await db.auditLog.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <AuditLogsClient logs={JSON.parse(JSON.stringify(logs))} />
  )
}
