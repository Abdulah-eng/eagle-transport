import { prisma } from "@/lib/db/client";
import RoutesClient from "./routes-client";

export const dynamic = "force-dynamic";

export default async function AdminRoutesPage() {
  let routes: any[] = [];
  let schools: any[] = [];
  let students: any[] = [];

  try {
    const res = await Promise.all([
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
    routes = res[0] || [];
    schools = res[1] || [];
    students = res[2] || [];
  } catch (err) {
    console.error("[ADMIN_ROUTES_DB_ERROR]", err);
  }

  return (
    <RoutesClient 
      routes={JSON.parse(JSON.stringify(routes))} 
      schools={JSON.parse(JSON.stringify(schools))} 
      students={JSON.parse(JSON.stringify(students))} 
    />
  );
}
