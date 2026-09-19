import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import AdminLayoutWrapper from "@/components/admin/admin-layout-wrapper";

export default async function AdminPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  
  if (process.env.NODE_ENV !== "development" && (!session?.user || (session.user.role !== "EAGLE_ADMIN" && session.user.role !== "OFFICE_STAFF"))) {
    redirect("/auth/login");
  }

  const user = {
    name: session?.user?.name || "Admin User",
    email: session?.user?.email || "admin@eaglebus.com",
    role: session?.user?.role || "EAGLE_ADMIN"
  };

  return (
    <AdminLayoutWrapper user={user}>
      {children}
    </AdminLayoutWrapper>
  );
}
