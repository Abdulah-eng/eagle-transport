import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/db/client"
import SchoolLayoutWrapper from "@/components/school-portal/school-layout-wrapper"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SchoolPortalLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ schoolId: string }>
}) {
  const resolvedParams = await params
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/login")
  }

  const schoolIdParam = resolvedParams?.schoolId || ""

  let school: any = null
  try {
    if (schoolIdParam) {
      school = await prisma.school.findFirst({
        where: {
          OR: [
            { id: schoolIdParam },
            { code: schoolIdParam.toUpperCase() }
          ]
        }
      })
    }
    if (!school) {
      school = await prisma.school.findFirst()
    }
  } catch (err) {
    console.warn("[SCHOOL_LAYOUT_PRISMA_ERROR]", err)
  }

  if (!school && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/schools?select=*`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        cache: 'no-store'
      })
      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows) && rows.length > 0) {
          school = rows.find((s: any) => 
            s.id === schoolIdParam || 
            s.id.includes(schoolIdParam) || 
            s.code === schoolIdParam.toUpperCase()
          ) || rows[0]
        }
      }
    } catch (e) {
      console.error("[SCHOOL_LAYOUT_SUPABASE_FALLBACK_ERROR]", e)
    }
  }

  const schoolName = school?.name || "School Partner"

  return (
    <SchoolLayoutWrapper
      schoolId={resolvedParams.schoolId}
      schoolName={schoolName}
      userName={session.user.name}
    >
      {children}
    </SchoolLayoutWrapper>
  )
}
