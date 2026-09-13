import { prisma } from "@/lib/db/client";
import RegistrationsClient from "./registrations-client";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  const registrations = await prisma.registration.findMany({
    include: {
      student: {
        include: {
          school: true,
          parent: { include: { user: true } }
        }
      },
      school: true,
    },
    orderBy: { submittedAt: "desc" }
  });

  return <RegistrationsClient registrations={JSON.parse(JSON.stringify(registrations))} />;
}
