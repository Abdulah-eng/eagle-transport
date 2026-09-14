import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import ParentProfileClient from "./profile-client"

export default async function ParentProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  let parent: any = null
  try {
    parent = await db.parent.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" }
        ]
      }
    })
  } catch (err) {
    console.error("[PARENT_PROFILE_DB_ERROR]", err)
  }

  if (!parent) {
    try {
      parent = await db.parent.findFirst()
    } catch (fallbackErr) {
      console.error("[PARENT_PROFILE_FALLBACK_DB_ERROR]", fallbackErr)
    }
  }

  return (
    <ParentProfileClient parent={JSON.parse(JSON.stringify(parent))} />
  )
}
