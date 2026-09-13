import { prisma } from "@/lib/db/client";
import RoutesClient from "./routes-client";

export const dynamic = "force-dynamic";

export default async function AdminRoutesPage() {
  const [routes, schools, students] = await Promise.all([
    prisma.route.findMany({
      include: {
        school: true,
        runs: {
          include: { stops: true }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.school.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.student.findMany({
      include: {
        school: true,
        parent: true
      }
    })
  ]);

  return (
    <RoutesClient 
      routes={JSON.parse(JSON.stringify(routes))} 
      schools={JSON.parse(JSON.stringify(schools))} 
      students={JSON.parse(JSON.stringify(students))} 
    />
  );
}
