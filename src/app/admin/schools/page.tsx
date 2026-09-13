import { prisma } from "@/lib/db/client";
import SchoolsClient from "./schools-client";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage() {
  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    include: {
      settings: true,
      contacts: true,
      students: true,
      routes: true,
    }
  });

  return <SchoolsClient schools={JSON.parse(JSON.stringify(schools))} />;
}
