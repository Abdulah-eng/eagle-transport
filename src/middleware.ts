import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";

// Public routes that don't require auth
const PUBLIC_ROUTES = ["/", "/intake", "/review", "/auth"];
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

// Role-based route access map
const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["EAGLE_ADMIN", "OFFICE_STAFF"],
  "/school-portal": ["EAGLE_ADMIN", "OFFICE_STAFF", "SCHOOL_ADMIN"],
  "/driver": ["EAGLE_ADMIN", "OFFICE_STAFF", "DRIVER"],
  "/parent": ["EAGLE_ADMIN", "OFFICE_STAFF", "PARENT"],
};

export default auth((req: any) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const userRole = session?.user?.role;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/")
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => nextUrl.pathname.startsWith(route));

  // If on auth page and already logged in, redirect to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRole), nextUrl));
  }

  // Allow public routes
  if (isPublicRoute) return NextResponse.next();

  // Must be logged in for protected routes
  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (nextUrl.pathname.startsWith(prefix)) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/unauthorized", nextUrl));
      }
    }
  }

  return NextResponse.next();
});

function getDashboardUrl(role?: UserRole): string {
  switch (role) {
    case "EAGLE_ADMIN":
    case "OFFICE_STAFF":
      return "/admin/dashboard";
    case "SCHOOL_ADMIN":
      return "/school-portal";
    case "DRIVER":
      return "/driver/dashboard";
    case "PARENT":
      return "/parent/dashboard";
    default:
      return "/";
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
