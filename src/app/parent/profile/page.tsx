import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import ParentProfileClient from "./profile-client"

export default async function ParentProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  let parent = await db.parent.findFirst({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email || "" }
      ]
    }
  })

  if (!parent) {
    parent = await db.parent.findFirst()
  }

  return (
    <ParentProfileClient parent={JSON.parse(JSON.stringify(parent))} />
  )
}
