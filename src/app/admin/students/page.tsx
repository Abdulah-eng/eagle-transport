import { prisma } from "@/lib/db/client";
import StudentsClient from "./students-client";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const [students, schools] = await Promise.all([
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

  return <StudentsClient students={JSON.parse(JSON.stringify(students))} schools={JSON.parse(JSON.stringify(schools))} />;
}
