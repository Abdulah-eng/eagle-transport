import { prisma } from "@/lib/db/client";
import RegistrationsClient from "./registrations-client";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  let registrations: any[] = [];
  try {
    registrations = await prisma.registration.findMany({
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
  } catch (err) {
    console.error("[ADMIN_REGISTRATIONS_DB_ERROR]", err);
  }

  return <RegistrationsClient registrations={JSON.parse(JSON.stringify(registrations))} />;
}
