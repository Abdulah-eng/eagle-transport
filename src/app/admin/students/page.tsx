import { prisma } from "@/lib/db/client";
import StudentsClient from "./students-client";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  let students: any[] = [];
  let schools: any[] = [];

  try {
    const res = await Promise.all([
      prisma.student.findMany({
        include: {
          school: true,
          parent: {
            include: { user: true }
          }
        },
        orderBy: { lastName: "asc" }
      }),
      prisma.school.findMany({
        orderBy: { name: "asc" }
      })
    ]);
    students = res[0] || [];
    schools = res[1] || [];
  } catch (err) {
    console.error("[ADMIN_STUDENTS_DB_ERROR]", err);
  }

  return <StudentsClient students={JSON.parse(JSON.stringify(students))} schools={JSON.parse(JSON.stringify(schools))} />;
}
