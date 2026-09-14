import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";

// Public routes that don't require auth
const PUBLIC_ROUTES = [
  "/",
  "/intake",
  "/review",
  "/auth",
  "/privacy-policy",
  "/terms-of-service",
  "/terms",
  "/rules"
];
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

// Role-based route access map
const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["EAGLE_ADMIN", "OFFICE_STAFF"],
  "/school-portal": ["EAGLE_ADMIN", "OFFICE_STAFF", "SCHOOL_ADMIN"],
  "/driver": ["DRIVER"],
  "/parent": ["PARENT"],
};

export default auth((req: any) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const userRole = session?.user?.role as UserRole | undefined;

  // Resolve base origin matching the exact host requested (e.g. www.eaglebusconnect.com vs eaglebusconnect.com)
  const host = req.headers.get("host") || nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const requestOrigin = `${proto}://${host}`;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/")
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => nextUrl.pathname.startsWith(route));

  const createRedirect = (targetPath: string) => {
    const redirectUrl = new URL(targetPath, requestOrigin);
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set("Access-Control-Allow-Origin", req.headers.get("origin") || "*");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    return response;
  };

  // If on auth page and already logged in, redirect to dashboard
  if (isAuthRoute && isLoggedIn) {
    return createRedirect(getDashboardUrl(userRole));
  }

  // Allow public routes
  if (isPublicRoute) return NextResponse.next();

  // Must be logged in for protected routes
  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login", requestOrigin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Access-Control-Allow-Origin", req.headers.get("origin") || "*");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    return response;
  }

  // Check role-based access
  for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (nextUrl.pathname.startsWith(prefix)) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        // Automatically redirect logged-in users to their authorized dashboard if trying to cross portals
        return createRedirect(getDashboardUrl(userRole));
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
