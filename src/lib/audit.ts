import { db } from "@/lib/db"

export async function logAuditAction(params: {
  userId?: string
  action: string
  entity: string
  entityId?: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValues: params.oldValues || undefined,
        newValues: params.newValues || undefined,
        ipAddress: params.ipAddress || "127.0.0.1",
        userAgent: params.userAgent || "Eagle Bus Internal Engine",
      }
    })
  } catch (err) {
    console.error("[AUDIT_LOG_ERROR]", err)
  }
}
