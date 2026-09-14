import { prisma } from "@/lib/db/client";
import SchoolsClient from "./schools-client";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage() {
  let schools: any[] = [];
  try {
    schools = await prisma.school.findMany({
      orderBy: { name: "asc" },
      include: {
        settings: true,
        contacts: true,
        students: true,
        routes: true,
      }
    });
  } catch (err) {
    console.error("[ADMIN_SCHOOLS_DB_ERROR]", err);
  }

  return <SchoolsClient schools={JSON.parse(JSON.stringify(schools))} />;
}
